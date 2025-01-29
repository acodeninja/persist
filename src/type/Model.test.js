import {expect, test} from '@jest/globals';
import {MainModel} from '../../test/fixtures/Models.js';
import {Models} from '../../test/fixtures/ModelCollection.js';
import Type from './index.js';
import {ValidationError} from '../SchemaCompiler.js';

test('constructor() creates a model instance with an id', () => {
    const model = new MainModel();

    expect(new RegExp(/MainModel\/[A-Z0-9]+/).test(model.id)).toBe(true);
});

test('constructor(valid) creates a model using the input valid', () => {
    const model = new MainModel({string: 'String'});

    expect(new RegExp(/MainModel\/[A-Z0-9]+/).test(model.id)).toBe(true);

    expect(model.toData()).toStrictEqual(expect.objectContaining({string: 'String'}));
});

test('model.toData() returns an object representation of the model', () => {
    const data = new Models().createFullTestModel().toData();

    delete data.id;

    const model = new MainModel(data);

    expect(model.toData()).toStrictEqual(expect.objectContaining(data));
});

test('model.toIndexData() returns an object with the index properties', () => {
    const index = new Models().createFullTestModel().toIndexData();

    expect({
        arrayOfString: ['test'],
        boolean: false,
        id: 'MainModel/000000000000',
        linked: {string: 'test', boolean: true},
        linkedMany: [{string: 'many'}],
        number: 24.3,
        string: 'test',
        stringSlug: 'test',
    }).toEqual(index);
});

test('model.toSearchData() returns an object with the searchable properties', () => {
    const index = new Models().createFullTestModel().toSearchData();

    expect({
        id: 'MainModel/000000000000',
        linked: {string: 'test'},
        linkedMany: [{string: 'many'}],
        string: 'test',
        stringSlug: 'test',
    }).toEqual(index);
});

test('Model.fromData(data) produces a model', () => {
    const data = new Models().createFullTestModel().toData();
    const model = MainModel.fromData(data);

    expect(model).toBeInstanceOf(MainModel);
    expect(model.toData()).toEqual(data);
});

test('model.validate() returns true', () => {
    const model = new Models().createFullTestModel();

    expect(model.validate()).toBe(true);
});

test('invalidModel.validate() throws error', () => {
    const model = new Models().createFullTestModel();
    model.string = 123;

    expect(() => model.validate()).toThrowError(ValidationError);
});

test('Model.isModel(model) returns true', () => {
    expect(Type.Model.isModel(new Models().createFullTestModel())).toBe(true);
});

test('Model.isModel(non-model) returns false', () => {
    expect(Type.Model.isModel({})).toBe(false);
});

test('Model.isDryModel(dry-model) returns true', () => {
    expect(Type.Model.isDryModel({
        id: 'DryModel/0000A1111B',
    })).toBe(true);
});

test('Model.isDryModel(not-a-model) returns false', () => {
    expect(Type.Model.isDryModel({})).toBe(false);
});

test('Model.isDryModel(hydrated-model) returns false', () => {
    expect(Type.Model.isDryModel(new Models().createFullTestModel())).toBe(false);
});

test('Model.isDryModel(almost-dry-model) returns false', () => {
    expect(Type.Model.isDryModel({
        id: 'NotADryModel/',
    })).toBe(false);
});
