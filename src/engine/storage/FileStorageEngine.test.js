import {CannotDeleteEngineError, EngineError, NotFoundEngineError} from './StorageEngine.js';
import {CircularManyModel, CircularModel, LinkedManyModel, LinkedModel, MainModel} from '../../../test/fixtures/Models.js';
import {describe, expect, test} from '@jest/globals';
import FileStorageEngine from './FileStorageEngine.js';
import {Models} from '../../../test/fixtures/ModelCollection.js';
import fs from 'node:fs/promises';
import stubFs from '../../../test/mocks/fs.js';

test('FileStorageEngine.configure(configuration) returns a new engine without altering the exising one', () => {
    const originalStore = FileStorageEngine;
    const configuredStore = originalStore.configure({path: '/tmp/fileEngine'});

    expect(configuredStore.configuration).toEqual({path: '/tmp/fileEngine', filesystem: fs});
    expect(originalStore.configuration).toBe(undefined);
});

describe('FileStorageEngine.get', () => {
    test('FileStorageEngine.get(MainModel, id) when engine is not configured', async () => {
        await expect(() => FileStorageEngine.get(MainModel, 'MainModel/000000000000'))
            .rejects
            .toThrow(expect.objectContaining({
                message: 'StorageEngine is miss-configured',
            }));
    });

    test('FileStorageEngine.get(MainModel, id) when id exists', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const filesystem = stubFs({}, Object.values(models.models));

        const got = await FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).get(MainModel, 'MainModel/000000000000');

        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/000000000000.json');
        expect(got instanceof MainModel).toBe(true);
        expect(got.validate()).toBeTruthy();
        expect(got.toData()).toStrictEqual(model.toData());
    });

    test('FileStorageEngine.get(MainModel, id) when id does not exist', async () => {
        const filesystem = stubFs();

        await expect(() =>
            FileStorageEngine.configure({
                path: '/tmp/fileEngine',
                filesystem,
            }).get(MainModel, 'MainModel/000000000000'),
        ).rejects.toThrow({
            instanceOf: NotFoundEngineError,
            message: 'FileStorageEngine.get(MainModel/000000000000) model not found',
        });
    });
});

describe('FileStorageEngine.put', () => {
    test('FileStorageEngine.put(model)', async () => {
        const filesystem = stubFs();

        const models = new Models();
        const model = models.createFullTestModel();

        await FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).put(model);

        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/000000000000.json', JSON.stringify(model.toData()));
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_index.json', JSON.stringify(models.getIndex(MainModel)));

        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_search_index_raw.json');
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_search_index_raw.json', JSON.stringify(models.getRawSearchIndex(MainModel)));

        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_search_index.json', JSON.stringify(models.getSearchIndex(MainModel)));

        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/LinkedModel/000000000000.json', JSON.stringify(model.linked.toData()));
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/LinkedModel/000000000001.json', JSON.stringify(model.requiredLinked.toData()));
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/LinkedModel/_index.json', JSON.stringify(models.getIndex(LinkedModel)));

        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/LinkedManyModel/000000000000.json', JSON.stringify(model.linkedMany[0].toData()));
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/LinkedManyModel/_index.json', JSON.stringify(models.getIndex(LinkedManyModel)));

        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/CircularModel/000000000000.json', JSON.stringify(model.circular.toData()));
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/CircularModel/_index.json', JSON.stringify(models.getIndex(CircularModel)));

        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/CircularManyModel/000000000000.json', JSON.stringify(model.circularMany[0].toData()));
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/CircularManyModel/_index.json', JSON.stringify(models.getIndex(CircularManyModel)));

        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/_index.json', JSON.stringify(models.getIndex()));
    });

    test('FileStorageEngine.put(model) updates existing search indexes', async () => {
        const filesystem = stubFs({
            'MainModel/_search_index_raw.json': {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        });

        const models = new Models();
        const model = models.createFullTestModel();

        await FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).put(model);

        expect(filesystem.readFile).toHaveBeenCalledTimes(8);
        expect(filesystem.writeFile).toHaveBeenCalledTimes(16);

        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_search_index_raw.json');

        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_search_index_raw.json', JSON.stringify(models.getRawSearchIndex(
            MainModel,
            {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        )));

        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_search_index.json', JSON.stringify(models.getSearchIndex(
            MainModel,
            {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        )));
    });

    test('FileStorageEngine.put(model) updates existing indexes', async () => {
        const filesystem = stubFs({
            'MainModel/_index.json': {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
            '_index.json': {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        });

        const models = new Models();
        const model = models.createFullTestModel();

        await FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).put(model);

        expect(filesystem.readFile).toHaveBeenCalledTimes(8);
        expect(filesystem.writeFile).toHaveBeenCalledTimes(16);

        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_index.json');
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_index.json', JSON.stringify(models.getIndex(
            MainModel,
            {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        )));

        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/_index.json');
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/_index.json', JSON.stringify(models.getIndex(undefined, {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        })));
    });

    test('FileStorageEngine.put(model) when putting an index fails', async () => {
        const filesystem = stubFs({
            'MainModel/_index.json': {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        });

        filesystem.writeFile.mockImplementation(path => {
            if (path.endsWith('/_index.json')) {
                throw new Error();
            }
        });

        const models = new Models();
        const model = models.createFullTestModel();

        await expect(() => FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put file:///tmp/fileEngine/MainModel/_index.json',
        });

        expect(filesystem.readFile).toHaveBeenNthCalledWith(2, '/tmp/fileEngine/MainModel/_index.json');
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_index.json', JSON.stringify(models.getIndex(
            MainModel,
            {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        )));
    });

    test('FileStorageEngine.put(model) when the engine fails to put a compiled search index', async () => {
        const filesystem = stubFs();

        filesystem.writeFile.mockImplementation(path => {
            if (path.endsWith('/_search_index.json')) {
                throw new Error();
            }
        });

        const models = new Models();
        const model = models.createFullTestModel();

        await expect(() => FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put file:///tmp/fileEngine/MainModel/_search_index.json',
        });

        expect(filesystem.readFile).toHaveBeenCalledTimes(1);
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_search_index.json', JSON.stringify(models.getSearchIndex(MainModel)));
    });

    test('FileStorageEngine.put(model) when the engine fails to put a raw search index', async () => {
        const filesystem = stubFs();

        filesystem.writeFile.mockImplementation(path => {
            if (path.endsWith('_search_index_raw.json')) {
                throw new Error();
            }
        });

        const models = new Models();
        const model = models.createFullTestModel();

        await expect(() => FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put file:///tmp/fileEngine/MainModel/_search_index_raw.json',
        });

        expect(filesystem.readFile).toHaveBeenCalledTimes(1);
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_search_index_raw.json', JSON.stringify(models.getRawSearchIndex(MainModel)));
    });

    test('FileStorageEngine.put(model) when the initial model put fails', async () => {
        const filesystem = stubFs();

        filesystem.writeFile.mockImplementation(path => {
            if (path.endsWith('MainModel/000000000000.json')) {
                throw new Error();
            }
        });

        const models = new Models();
        const model = models.createFullTestModel();

        await expect(() => FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put file:///tmp/fileEngine/MainModel/000000000000.json',
        });

        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/000000000000.json', JSON.stringify(model.toData()));
        expect(filesystem.readFile).toHaveBeenCalledTimes(0);
        expect(filesystem.writeFile).toHaveBeenCalledTimes(1);
    });

    test('FileStorageEngine.put(model) when the engine fails to put a linked model', async () => {
        const filesystem = stubFs();

        filesystem.writeFile.mockImplementation(path => {
            if (path.endsWith('LinkedModel/000000000000.json')) {
                throw new Error();
            }
        });

        const models = new Models();
        const model = models.createFullTestModel();

        await expect(() => FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).put(model)).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put file:///tmp/fileEngine/LinkedModel/000000000000.json',
        });

        expect(filesystem.readFile).toHaveBeenCalledTimes(1);
        expect(filesystem.writeFile).toHaveBeenCalledTimes(4);

        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_search_index_raw.json');

        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/000000000000.json', JSON.stringify(model.toData()));

        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_search_index_raw.json', JSON.stringify(models.getRawSearchIndex(MainModel)));

        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_search_index.json', JSON.stringify(models.getSearchIndex(MainModel)));

        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/LinkedModel/000000000000.json', JSON.stringify(model.linked.toData()));
    });
});

describe('FileStorageEngine.find', () => {
    test('FileStorageEngine.find(MainModel, {string: "test"}) when a matching model exists', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const filesystem = stubFs({}, Object.values(models.models));

        const found = await FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).find(MainModel, {string: 'test'});

        expect(found).toStrictEqual([expect.objectContaining(model.toIndexData())]);
    });

    test('FileStorageEngine.find(MainModel, {string: "test"}) when a matching model does not exist', async () => {
        const filesystem = stubFs({'MainModel/_index.json': {}});

        const models = await FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).find(MainModel, {string: 'test'});

        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_index.json');

        expect(models).toEqual([]);
    });

    test('FileStorageEngine.find(MainModel, {string: "test"}) when no index exists', async () => {
        const filesystem = stubFs({}, []);

        const models = await FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).find(MainModel, {string: 'String'});

        expect(models).toEqual([]);
    });
});

describe('FileStorageEngine.search', () => {
    test('FileStorageEngine.search(MainModel, "test") when matching models exist', async () => {
        const models = new Models();
        const model1 = models.createFullTestModel();
        const model2 = models.createFullTestModel();

        model2.string = 'moving tests';

        const filesystem = stubFs({}, Object.values(models.models));

        const configuration = {
            path: '/tmp/fileEngine',
            filesystem,
        };

        const found = await FileStorageEngine.configure(configuration).search(MainModel, 'test');

        expect(found).toStrictEqual([
            expect.objectContaining({
                ref: 'MainModel/000000000000',
                score: 0.666,
                model: expect.objectContaining(model1.toData(false)),
            }),
            expect.objectContaining({
                ref: 'MainModel/000000000001',
                score: 0.506,
                model: expect.objectContaining(model2.toData(false)),
            }),
        ]);
    });

    test('FileStorageEngine.search(MainModel, "not-even-close-to-a-match") when no matching model exists', async () => {
        const models = new Models();
        models.createFullTestModel();

        const filesystem = stubFs({}, Object.values(models.models));

        const configuration = {
            path: '/tmp/fileEngine',
            filesystem,
        };

        const found = await FileStorageEngine.configure(configuration).search(MainModel, 'not-even-close-to-a-match');

        expect(found).toEqual([]);
    });

    test('FileStorageEngine.search(MainModel, "test") when no index exists for the model', async () => {
        const filesystem = stubFs({}, []);

        const configuration = {
            path: '/tmp/fileEngine',
            filesystem,
        };

        await expect(() => FileStorageEngine.configure(configuration).search(MainModel, 'test')).rejects.toThrowError({
            instanceOf: EngineError,
            message: 'The model MainModel does not have a search index available.',
        });
    });
});

describe('FileStorageEngine.hydrate', () => {
    test('FileStorageEngine.hydrate(model)', async () => {
        const models = new Models();
        const model = models.createFullTestModel();

        const dryModel = new MainModel();
        dryModel.id = 'MainModel/000000000000';

        const filesystem = stubFs({}, [model]);

        const hydratedModel = await FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).hydrate(dryModel);

        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/000000000000.json');
        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/CircularModel/000000000000.json');
        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/CircularRequiredModel/000000000000.json');
        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/LinkedModel/000000000000.json');
        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/LinkedModel/000000000001.json');
        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/LinkedManyModel/000000000000.json');
        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/CircularManyModel/000000000000.json');

        expect(filesystem.readFile).toHaveBeenCalledTimes(7);
        expect(hydratedModel).toEqual(model);
    });
});

describe('FileStorageEngine.delete', () => {
    test('FileStorageEngine.delete(model)', async () => {
        const models = new Models();
        models.createFullTestModel();
        const modelToBeDeleted = models.createFullTestModel();

        const filesystem = stubFs({}, Object.values(models.models));

        await FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).delete(modelToBeDeleted);

        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/000000000001.json');
        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/CircularModel/000000000001.json');
        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/CircularRequiredModel/000000000001.json');
        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/LinkedModel/000000000002.json');
        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/LinkedModel/000000000003.json');
        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/LinkedManyModel/000000000001.json');
        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/CircularManyModel/000000000001.json');

        expect(filesystem.readFile).toHaveBeenCalledTimes(17);

        const searchIndexWithout = models.getRawSearchIndex(MainModel);
        delete searchIndexWithout[modelToBeDeleted.id];
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_search_index_raw.json', JSON.stringify(searchIndexWithout));

        const mainModelIndexWithout = models.getIndex(MainModel);
        delete mainModelIndexWithout[modelToBeDeleted.id];
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/_index.json', JSON.stringify(mainModelIndexWithout));

        const globalModelIndexWithout = models.getIndex();
        delete globalModelIndexWithout[modelToBeDeleted.id];
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/_index.json', JSON.stringify(globalModelIndexWithout));

        const circularModelWithout = modelToBeDeleted.circular.toData();
        delete circularModelWithout.linked;
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/CircularModel/000000000001.json', JSON.stringify(circularModelWithout));

        const circularMany1ModelWithout = modelToBeDeleted.circularMany[0].toData();
        circularMany1ModelWithout.linked = [];
        expect(filesystem.writeFile).toHaveBeenCalledWith('/tmp/fileEngine/CircularManyModel/000000000001.json', JSON.stringify(circularMany1ModelWithout));

        expect(
            Object.keys(filesystem.resolvedFiles).includes('MainModel/000000000001.json'),
        ).toBeFalsy();

        expect(filesystem.rm).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/000000000001.json');
        expect(filesystem.rm).toHaveBeenCalledWith('/tmp/fileEngine/CircularRequiredModel/000000000001.json');

        expect(filesystem.rm).toHaveBeenCalledTimes(2);
    });

    test('FileStorageEngine.delete(model) when rm throws an error', async () => {
        const models = new Models();
        const model = models.createFullTestModel();
        const modelToBeDeleted = models.createFullTestModel();

        const filesystem = stubFs({}, [model, modelToBeDeleted]);

        modelToBeDeleted.id = 'MainModel/999999999999';

        await expect(() => FileStorageEngine.configure({
            path: '/tmp/fileEngine',
            filesystem,
        }).delete(modelToBeDeleted)).rejects.toThrowError({
            instanceOf: CannotDeleteEngineError,
            message: 'FileStorageEngine.delete(MainModel/999999999999) model cannot be deleted',
            underlyingError: true,
        });

        expect(filesystem.readFile).toHaveBeenCalledWith('/tmp/fileEngine/MainModel/999999999999.json');

        expect(filesystem.readFile).toHaveBeenCalledTimes(1);

        expect(Object.keys(filesystem.resolvedFiles).includes('MainModel/000000000001.json')).toBeTruthy();

        expect(filesystem.rm).toHaveBeenCalledTimes(0);
    });
});
