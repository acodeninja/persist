import {beforeAll, describe, expect, test} from '@jest/globals';
import Connection from '../../src/Connection.js';
import Persist from '../../src/Persist.js';
import {TestStorageEngineFactory} from '../fixtures/Engine.js';

describe('regressions', () => {
    describe('delete causes a model to be inserted into an index it does not belong in', () => {
        class Page extends Persist.Model {
            static {
                Page.withName('Page');
                Page.title = Persist.Property.String.required;
                Page.tags = () => Persist.Property.Array.of(PageTag);
                Page.indexedProperties = () => ['title', 'tags.[*].label'];
                Page.searchProperties = () => ['title', 'tags.[*].label'];
            }
        }

        class PageTag extends Persist.Model {
            static {
                PageTag.withName('PageTag');
                PageTag.label = Persist.Property.String.required;
                PageTag.pages = () => Persist.Property.Array.of(Page);
                PageTag.indexedProperties = () => ['label', 'pages.[*].title'];
            }
        }

        class MenuItem extends Persist.Model {
            static {
                MenuItem.withName('MenuItem');
                MenuItem.label = Persist.Property.String.required;
                MenuItem.page = Page.required;
                MenuItem.indexedProperties = () => ['label', 'page.title'];
            }
        }

        const tag = new PageTag({label: 'TagOne', pages: []});

        const pageToBeDeleted = new Page({title: 'PageOne', tags: [tag]});
        tag.pages.push(pageToBeDeleted);

        const pageToBeKept = new Page({title: 'PageTwo', tags: [tag]});
        tag.pages.push(pageToBeKept);

        const item = new MenuItem({label: 'ItemOne', page: pageToBeDeleted});

        const engine = TestStorageEngineFactory([pageToBeDeleted, tag, item]);
        const connection = new Connection(engine, [MenuItem, Page, PageTag]);

        beforeAll(() => connection.delete(pageToBeDeleted, [item.id, tag.id]));

        describe('MenuItem', () => {
            test('the menu item is deleted', () => {
                expect(engine.virtualStorage).not.toHaveProperty(item.id);
            });

            test('the menu item index is updated', () => {
                expect(engine.virtualStorage).toHaveProperty(`${MenuItem.name}/index`, {});
            });
        });

        describe('PageTag', () => {
            test('the tag is updated', () => {
                expect(engine.virtualStorage).toHaveProperty(tag.id, {
                    id: tag.id,
                    label: 'TagOne',
                    pages: [{id: pageToBeKept.id}],
                });
            });

            test('the tag index is updated', () => {
                expect(engine.virtualStorage).toHaveProperty(`${PageTag.name}/index`, {
                    [tag.id]: {
                        id: tag.id,
                        label: 'TagOne',
                        pages: [{id: pageToBeKept.id, title: pageToBeKept.title}],
                    },
                });
            });
        });

        describe('Page', () => {
            test('the page \'pageToBeDeleted\' is deleted', () => {
                expect(engine.virtualStorage).not.toHaveProperty(pageToBeDeleted.id);
            });

            test('the page \'pageToBeKept\' is not deleted', () => {
                expect(engine.virtualStorage).toHaveProperty(pageToBeKept.id);
            });

            test('the Page index is updated', () => {
                expect(engine.virtualStorage).toHaveProperty(`${Page.name}/index`, {
                    [pageToBeKept.id]: {
                        id: pageToBeKept.id,
                        title: pageToBeKept.title,
                        tags: pageToBeKept.tags.map(tag => ({id: tag.id, label: tag.label})),
                    },
                });
            });

            test('the Page search index is updated', () => {
                expect(engine.virtualStorage).toHaveProperty(`${Page.name}/search`, {
                    [pageToBeKept.id]: {
                        id: pageToBeKept.id,
                        title: pageToBeKept.title,
                        tags: pageToBeKept.tags.map(tag => ({label: tag.label})),
                    },
                });
            });
        });
    });
});
