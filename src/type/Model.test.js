import {MainModel, getTestModelInstance, invalid, valid} from '../../test/fixtures/TestModel.js';
import Type from './index.js';
import {ValidationError} from '../SchemaCompiler.js';
import test from 'ava';

test('constructor() creates a model instance with an id', t => {
    const model = getTestModelInstance();

    t.true(!!model.id.match(/MainModel\/[A-Z0-9]+/));
});

test('constructor(valid) creates a model using the input valid', t => {
    const model = new MainModel(valid);

    t.true(!!model.id.match(/MainModel\/[A-Z0-9]+/));

    t.like(model.toData(), {
        ...valid,
        stringSlug: 'string',
        requiredStringSlug: 'required-string',
    });
});

test('model.toData() returns an object representation of the model', t => {
    const model = getTestModelInstance(valid);

    t.deepEqual(model.toData(), {
        ...valid,
        id: 'MainModel/000000000000',
        stringSlug: 'string',
        requiredStringSlug: 'required-string',
        linked: {id: 'LinkedModel/000000000000'},
        requiredLinked: {id: 'LinkedModel/111111111111'},
        circular: {id: 'CircularModel/000000000000'},
        linkedMany: [{id: 'LinkedManyModel/000000000000'}],
        emptyArrayOfModels: [],
        circularMany: [{id: 'CircularManyModel/000000000000'}],
    });
});

test('model.toIndexData() returns an object with the index properties', t => {
    const index = new Type.Model(valid).toIndexData();

    t.assert(index.id.match(/Model\/[A-Z0-9]+/));
});

test('testModel.toIndexData() returns an object with the indexed properties', t => {
    const index = getTestModelInstance(valid).toIndexData();

    t.deepEqual(index, {
        id: 'MainModel/000000000000',
        string: 'String',
        linked: {string: 'test'},
        stringSlug: 'string',
    });
});

test('model.toSearchData() returns an object with the searchable properties', t => {
    const searchData = new Type.Model(valid).toSearchData();

    t.assert(searchData.id.match(/Model\/[A-Z0-9]+/));
});

test('testModel.toSearchData() returns an object with the searchable properties', t => {
    const searchData = getTestModelInstance(valid).toSearchData();

    t.deepEqual(searchData, {
        id: 'MainModel/000000000000',
        string: 'String',
    });
});

test('TestModel.fromData(data) produces a model', t => {
    const model = MainModel.fromData(valid);

    t.assert(model instanceof MainModel);
    t.like(model.toData(), {
        ...valid,
        stringSlug: 'string',
        requiredStringSlug: 'required-string',
    });
});

test('model.validate() returns true', t => {
    const model = getTestModelInstance(valid);

    t.true(model.validate());
});

test('invalidModel.validate() returns true', t => {
    const model = getTestModelInstance(invalid);

    t.throws(() => model.validate(), {instanceOf: ValidationError});
});

test('Model.isModel(model) returns true', t => {
    t.true(Type.Model.isModel(getTestModelInstance()));
});

test('Model.isModel(non-model) returns false', t => {
    t.false(Type.Model.isModel({}));
});

test('Model.isDryModel(dry-model) returns true', t => {
    t.true(Type.Model.isDryModel({
        id: 'DryModel/0000A1111B',
    }));
});

test('Model.isDryModel(non-dry-model) returns false', t => {
    t.false(Type.Model.isDryModel({}));
});

test('Model.isDryModel(almost-dry-model) returns false', t => {
    t.false(Type.Model.isDryModel({
        id: 'NotADryModel/',
    }));
});
