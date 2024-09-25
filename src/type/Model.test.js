import {MainModel} from '../../test/fixtures/Models.js';
import {Models} from '../../test/fixtures/ModelCollection.js';
import Type from './index.js';
import {ValidationError} from '../SchemaCompiler.js';
import test from 'ava';

test('constructor() creates a model instance with an id', t => {
    const model = new MainModel();

    t.true(new RegExp(/MainModel\/[A-Z0-9]+/).test(model.id));
});

test('constructor(valid) creates a model using the input valid', t => {
    const model = new MainModel({string: 'String'});

    t.true(new RegExp(/MainModel\/[A-Z0-9]+/).test(model.id));

    t.like(model.toData(), {string: 'String'});
});

test('model.toData() returns an object representation of the model', t => {
    const data = new Models().createFullTestModel().toData();

    delete data.id;

    const model = new MainModel(data);

    t.like(model.toData(), data);
});

test('model.toIndexData() returns an object with the index properties', t => {
    const index = new Models().createFullTestModel().toIndexData();

    t.deepEqual({
        arrayOfString: ['test'],
        boolean: false,
        id: 'MainModel/000000000000',
        linked: {string: 'test', boolean: true},
        linkedMany: [{string: 'many'}],
        number: 24.3,
        string: 'test',
        stringSlug: 'test',
    }, index);
});

test('model.toSearchData() returns an object with the searchable properties', t => {
    const index = new Models().createFullTestModel().toSearchData();

    t.deepEqual({
        id: 'MainModel/000000000000',
        linked: {string: 'test'},
        linkedMany: [{string: 'many'}],
        string: 'test',
        stringSlug: 'test',
    }, index);
});

test('Model.fromData(data) produces a model', t => {
    const data = new Models().createFullTestModel().toData();
    const model = MainModel.fromData(data);

    t.assert(model instanceof MainModel);
    t.deepEqual(model.toData(), data);
});

test('model.validate() returns true', t => {
    const model = new Models().createFullTestModel();

    t.true(model.validate());
});

test('invalidModel.validate() returns true', t => {
    const model = new Models().createFullTestModel();
    model.string = 123;

    t.throws(() => model.validate(), {instanceOf: ValidationError});
});

test('Model.isModel(model) returns true', t => {
    t.true(Type.Model.isModel(new Models().createFullTestModel()));
});

test('Model.isModel(non-model) returns false', t => {
    t.false(Type.Model.isModel({}));
});

test('Model.isDryModel(dry-model) returns true', t => {
    t.true(Type.Model.isDryModel({
        id: 'DryModel/0000A1111B',
    }));
});

test('Model.isDryModel(not-a-model) returns false', t => {
    t.false(Type.Model.isDryModel({}));
});

test('Model.isDryModel(hydrated-model) returns false', t => {
    t.false(Type.Model.isDryModel(new Models().createFullTestModel()));
});

test('Model.isDryModel(almost-dry-model) returns false', t => {
    t.false(Type.Model.isDryModel({
        id: 'NotADryModel/',
    }));
});
