import {
    CircularLinkedModel,
    CircularLinkedModelFactory,
    LinkedManyModelWithIndex,
    LinkedManyModelWithIndexFactory,
    LinkedModelWithSearchIndex,
    LinkedModelWithSearchIndexFactory,
    SimpleModel,
    SimpleModelFactory,
} from '../../test/fixtures/Model.js';
import {describe, expect, test} from '@jest/globals';
import Model from './Model.js';
import {ValidationError} from '../Schema.js';

describe('new Model', () => {
    const model = SimpleModelFactory();

    test('generates an id for the model', () => {
        expect(new RegExp(/SimpleModel\/[A-Z0-9]+/).test(model.id)).toBe(true);
    });

    test('has properties from constructor input', () => {
        expect(model).toHaveProperty('string', 'string');
    });

    test('has resolved properties from constructor input', () => {
        expect(model.stringSlug).toEqual('string');
    });
});

describe('model.toData()', () => {
    describe.each([
        [SimpleModel, SimpleModelFactory, {
            id: expect.stringMatching(/^SimpleModel\/[A-Z0-9]+/),
            arrayOfBoolean: [true],
            arrayOfDate: [expect.stringMatching(/^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+/)],
            arrayOfNumber: [1.4],
            arrayOfString: ['string'],
            boolean: true,
            date: expect.stringMatching(/^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+/),
            number: 1.4,
            string: 'string',
            stringSlug: 'string',
        }],
        [CircularLinkedModel, CircularLinkedModelFactory, {
            id: expect.stringMatching(/^CircularLinkedModel\/[A-Z0-9]+/),
            string: 'string',
            linked: {id: expect.stringMatching(/^CircularLinkedModel\/[A-Z0-9]+/)},
        }],
        [LinkedModelWithSearchIndex, LinkedModelWithSearchIndexFactory, {
            id: expect.stringMatching(/^LinkedModelWithSearchIndex\/[A-Z0-9]+/),
            string: 'string',
            linked: {id: expect.stringMatching(/^SimpleModelWithSearchIndex\/[A-Z0-9]+/)},
        }],
        [LinkedManyModelWithIndex, LinkedManyModelWithIndexFactory, {
            id: expect.stringMatching(/^LinkedManyModelWithIndex\/[A-Z0-9]+/),
            string: 'string',
            linked: [{id: expect.stringMatching(/^SimpleModelWithIndex\/[A-Z0-9]+/)}],
        }],
    ])('with a %s', (modelConstructor, modelFactory, expected) => {
        const model = modelFactory();

        test('returns an object representation of the model', () => {
            expect(model.toData()).toStrictEqual(expected);
        });
    });
});

describe('Model.fromData()', () => {
    describe.each([
        [SimpleModel, SimpleModelFactory],
        [CircularLinkedModel, CircularLinkedModelFactory],
        [LinkedModelWithSearchIndex, LinkedModelWithSearchIndexFactory],
        [LinkedManyModelWithIndex, LinkedManyModelWithIndexFactory],
    ])('with a %s', (modelConstructor, modelFactory) => {
        const data = modelFactory().toData();
        const model = modelConstructor.fromData(data);

        test('produces a model instance from an object', () => {
            expect(model).toBeInstanceOf(modelConstructor);
            expect(model.toData()).toEqual(data);
        });
    });
});

describe('model.toIndexData()', () => {
    describe.each([
        [SimpleModel, SimpleModelFactory],
        [CircularLinkedModel, CircularLinkedModelFactory],
        [LinkedModelWithSearchIndex, LinkedModelWithSearchIndexFactory],
        [LinkedManyModelWithIndex, LinkedManyModelWithIndexFactory],
    ])('with a %s', (modelConstructor, modelFactory) => {
        const model = modelFactory();
        const indexData = model.toIndexData();

        test('returns an object representation of the indexable fields of the model', () => {
            model.constructor.indexedProperties().forEach(field => {
                expect(model[field]).toEqual(indexData[field]);
            });
        });
    });
});

describe('model.toSearchData()', () => {
    describe.each([
        [SimpleModel, SimpleModelFactory],
        [CircularLinkedModel, CircularLinkedModelFactory],
        [LinkedModelWithSearchIndex, LinkedModelWithSearchIndexFactory],
        [LinkedManyModelWithIndex, LinkedManyModelWithIndexFactory],
    ])('with a %s', (modelConstructor, modelFactory) => {
        const model = modelFactory();
        const indexData = model.toSearchData();

        test('returns an object representation of the searchable fields of the model', () => {
            model.constructor.searchProperties().forEach(field => {
                expect(model[field]).toEqual(indexData[field]);
            });
        });
    });
});


describe('model.validate()', () => {
    describe.each([
        [SimpleModel, SimpleModelFactory],
        [CircularLinkedModel, CircularLinkedModelFactory],
        [LinkedModelWithSearchIndex, LinkedModelWithSearchIndexFactory],
        [LinkedManyModelWithIndex, LinkedManyModelWithIndexFactory],
    ])('with a %s', (modelConstructor, modelFactory) => {
        describe('for a valid model', () => {
            const model = modelFactory();

            test('returns true', () => {
                expect(model.validate()).toBe(true);
            });
        });

        describe('for an invalid model', () => {
            const model = modelFactory();
            model.string = false;

            test('throws a validation error', () => {
                expect(() => model.validate()).toThrowError(ValidationError);
            });
        });
    });
});

describe('Model.indexedPropertiesResolved()', () => {
    describe.each([
        [SimpleModel, ['id']],
        [CircularLinkedModel, ['linked.id', 'id']],
        [LinkedModelWithSearchIndex, ['linked.id', 'string', 'id']],
        [LinkedManyModelWithIndex, ['linked.[*].id', 'string', 'linked.[*].string', 'id']],
    ])('with a %s', (modelConstructor, expectedIndex) => {
        test(`returns ${expectedIndex}`, () => {
            expect(modelConstructor.indexedPropertiesResolved()).toEqual(expectedIndex);
        });
    });
});

describe('Model.isModel()', () => {
    describe('for an instance of a model', () => {
        test('returns true', () => {
            expect(Model.isModel(LinkedModelWithSearchIndexFactory())).toBe(true);
        });
    });

    const inputs = [
        'string',
        1.4,
        false,
        LinkedModelWithSearchIndexFactory().toData(),
        undefined,
    ];

    for (const input of inputs) {
        describe(`for a ${typeof input}`, () => {
            test('returns false', () => {
                expect(Model.isModel(input)).toBe(false);
            });
        });
    }
});

describe('Model.isDryModel()', () => {
    describe('for an instance of a model', () => {
        const model = LinkedModelWithSearchIndexFactory();

        test('returns false', () => {
            expect(Model.isDryModel(model)).toBeFalsy();
        });
    });

    describe('for an object representation of a model', () => {
        const data = LinkedModelWithSearchIndexFactory().toData();

        test('returns true', () => {
            expect(Model.isDryModel(data)).toBeTruthy();
        });
    });

    describe('for an object representation of a model with only the id', () => {
        const data = {id: 'Model/123ABC'};

        test('returns true', () => {
            expect(Model.isDryModel(data)).toBeTruthy();
        });
    });

    describe('for an object that almost looks like a model', () => {
        const data = {id: 'AlmostAModel/'};

        test('returns false', () => {
            expect(Model.isDryModel(data)).toBeFalsy();
        });
    });

    const inputs = [
        'string',
        1.4,
        false,
        new Date(),
        undefined,
    ];

    for (const input of inputs) {
        describe(`for a ${typeof input}`, () => {
            test('returns false', () => {
                expect(Model.isDryModel(input)).toBe(false);
            });
        });
    }
});

describe('Model.withName()', () => {
    test('overrides the name of the model', () => {
        class RenamedModel extends Model {
            static {
                this.withName('AnotherName');
            }
        }

        expect(RenamedModel.name).toBe('AnotherName');
    });
});
