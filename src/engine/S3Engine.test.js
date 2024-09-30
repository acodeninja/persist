import {CircularManyModel, CircularModel, LinkedManyModel, LinkedModel, MainModel} from '../../test/fixtures/Models.js';
import {EngineError, MissConfiguredError, NotFoundEngineError} from './Engine.js';
import {GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3';
import {Models} from '../../test/fixtures/ModelCollection.js';
import S3Engine from './S3Engine.js';
import assertions from '../../test/assertions.js';
import stubS3Client from '../../test/mocks/s3.js';
import test from 'ava';

test('S3Engine.configure(configuration) returns a new engine without altering the exising one', t => {
    const originalStore = S3Engine;
    const configuredStore = originalStore.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client: stubS3Client(),
    });

    t.like(configuredStore.configuration, {
        bucket: 'test-bucket',
        prefix: 'test',
    });
    t.assert(originalStore.configuration === undefined);
});

test('S3Engine.get(MainModel, id) when engine is not configured', async t => {
    const error = await t.throwsAsync(
        () =>  S3Engine.get(MainModel, 'MainModel/000000000000'),
        {
            instanceOf: MissConfiguredError,
        },
    );

    t.is(error.message, 'Engine is miss-configured');
});

test('S3Engine.get(MainModel, id) when id exists', async t => {
    const models = new Models();
    models.createFullTestModel();

    const client = stubS3Client({}, {
        'test-bucket': Object.values(models.models),
    });

    const model = await S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).get(MainModel, 'MainModel/000000000000');

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Bucket: 'test-bucket',
        Key: 'test/MainModel/000000000000.json',
    }));
    t.true(model instanceof MainModel);
    t.true(model.validate());
    t.like(model.toData(), models.models['MainModel/000000000000'].toData());
});

test('S3Engine.get(MainModel, id) when id does not exist', async t => {
    const client = stubS3Client();

    await t.throwsAsync(
        () => S3Engine.configure({
            bucket: 'test-bucket',
            prefix: 'test',
            client,
        }).get(MainModel, 'MainModel/000000000000'),
        {
            instanceOf: NotFoundEngineError,
            message: 'S3Engine.get(MainModel/000000000000) model not found',
        },
    );
});

test('S3Engine.put(model)', async t => {
    const client = stubS3Client();

    const models = new Models();
    const model = models.createFullTestModel();
    await t.notThrowsAsync(() => S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).put(model));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/000000000000.json',
        Body: JSON.stringify(model.toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/MainModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify(models.getIndex(MainModel)),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Body: JSON.stringify(models.getRawSearchIndex(MainModel)),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index.json',
        Body: JSON.stringify(models.getSearchIndex(MainModel)),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/LinkedModel/000000000000.json',
        Body: JSON.stringify(model.linked.toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/LinkedModel/000000000001.json',
        Body: JSON.stringify(model.requiredLinked.toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/LinkedModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/LinkedModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify(models.getIndex(LinkedModel)),
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/LinkedManyModel/000000000000.json',
        Body: JSON.stringify(model.linkedMany[0].toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/LinkedManyModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/LinkedManyModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify(models.getIndex(LinkedManyModel)),
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/CircularModel/000000000000.json',
        Body: JSON.stringify(model.circular.toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/CircularModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/CircularModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify(models.getIndex(CircularModel)),
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/CircularManyModel/000000000000.json',
        Body: JSON.stringify(model.circularMany[0].toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/CircularManyModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/CircularManyModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify(models.getIndex(CircularManyModel)),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify(models.getIndex()),
    }));
});

test('S3Engine.put(model) updates existing search indexes', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const client = stubS3Client({
        'test-bucket': {
            'MainModel/_search_index_raw.json': {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        },
    });

    await t.notThrowsAsync(() => S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).put(model));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Body: JSON.stringify(models.getRawSearchIndex(
            MainModel,
            {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        )),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index.json',
        Body: JSON.stringify(models.getSearchIndex(MainModel, {
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
        })),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));
});

test('S3Engine.put(model) updates existing indexes', async t => {
    const client = stubS3Client({
        'test-bucket': {
            'test/MainModel/_index.json': {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
            'test/_index.json': {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        },
    });

    const models = new Models();
    const model = models.createFullTestModel();

    await t.notThrowsAsync(() => S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).put(model));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/MainModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify(models.getIndex(
            MainModel,
            {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        )),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/LinkedModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/LinkedModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify(models.getIndex(LinkedModel)),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/LinkedManyModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/LinkedManyModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify(models.getIndex(LinkedManyModel)),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/CircularModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/CircularModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify(models.getIndex(CircularModel)),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/CircularManyModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/CircularManyModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify(models.getIndex(CircularManyModel)),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify(models.getIndex(
            undefined,
            {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        )),
    }));
});

test('S3Engine.put(model) when the engine fails to put a compiled search index', async t => {
    const client = stubS3Client({
        'test-bucket': {
            'MainModel/_index.json': {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        },
    });

    client.send.callsFake(command => {
        if (command.input.Key.endsWith('_search_index.json')) {
            return Promise.reject(new Error());
        }
        return Promise.resolve();
    });

    const models = new Models();
    const model = models.createFullTestModel();

    await t.throwsAsync(() => S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put s3://test-bucket/test/MainModel/_search_index.json',
    });

    t.is(client.send.getCalls().length, 4);

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/000000000000.json',
        Body: JSON.stringify(model.toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Body: JSON.stringify(models.getRawSearchIndex(MainModel)),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index.json',
        Body: JSON.stringify(models.getSearchIndex(MainModel)),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));
});

test('S3Engine.put(model) when the engine fails to put a raw search index', async t => {
    const client = stubS3Client({
        'test-bucket': {
            'MainModel/_index.json': {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        },
    });

    client.send.callsFake(command => {
        if (command.input.Key.endsWith('_search_index_raw.json')) {
            return Promise.reject(new Error());
        }
        return Promise.resolve();
    });

    const models = new Models();
    const model = models.createFullTestModel();

    await t.throwsAsync(() => S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put s3://test-bucket/test/MainModel/_search_index_raw.json',
    });

    t.is(client.send.getCalls().length, 3);

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/000000000000.json',
        Body: JSON.stringify(model.toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Body: JSON.stringify(models.getRawSearchIndex(MainModel)),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));
});

test('S3Engine.put(model) when putting an index fails', async t => {
    const client = stubS3Client({
        'test-bucket': {
            'MainModel/_index.json': {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        },
    });

    client.send.callsFake(command => {
        if (command.input.Key.endsWith('/_index.json')) {
            return Promise.reject(new Error());
        }
        return Promise.resolve();
    });

    const models = new Models();
    const model = models.createFullTestModel();

    await t.throwsAsync(() => S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put s3://test-bucket/test/MainModel/_index.json',
    });

    t.is(client.send.getCalls().length, 11);

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/000000000000.json',
        Body: JSON.stringify(model.toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/MainModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify(models.getIndex(MainModel)),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Body: JSON.stringify(models.getRawSearchIndex(MainModel)),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index.json',
        Body: JSON.stringify(models.getSearchIndex(MainModel)),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/LinkedModel/000000000000.json',
        Body: JSON.stringify(model.linked.toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: `test/${model.requiredLinked.id}.json`,
        Body: JSON.stringify(model.requiredLinked.toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/LinkedManyModel/000000000000.json',
        Body: JSON.stringify(model.linkedMany[0].toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/CircularModel/000000000000.json',
        Body: JSON.stringify(model.circular.toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/CircularManyModel/000000000000.json',
        Body: JSON.stringify(model.circularMany[0].toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));
});

test('S3Engine.put(model) when the initial model put fails', async t => {
    const client = stubS3Client({
        'test-bucket': {
            'MainModel/_index.json': {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        },
    });
    const models = new Models();
    const model = models.createFullTestModel();

    client.send.callsFake(command => {
        if (command.input.Key.endsWith('MainModel/000000000000.json')) {
            return Promise.reject(new Error());
        }
        return Promise.resolve();
    });

    await t.throwsAsync(() => S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put s3://test-bucket/test/MainModel/000000000000.json',
    });

    t.is(client.send.getCalls().length, 1);

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/000000000000.json',
        Body: JSON.stringify(model.toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));
});

test('S3Engine.put(model) when the engine fails to put a linked model', async t => {
    const client = stubS3Client({
        'test-bucket': {
            'MainModel/_index.json': {
                'MainModel/111111111111': {
                    id: 'MainModel/111111111111',
                    string: 'String',
                },
            },
        },
    });
    const models = new Models();
    const model = models.createFullTestModel();

    client.send.callsFake(command => {
        if (command.input.Key.endsWith('LinkedModel/000000000000.json')) {
            return Promise.reject(new Error());
        }
        return Promise.resolve();
    });

    await t.throwsAsync(() => S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put s3://test-bucket/test/LinkedModel/000000000000.json',
    });

    t.is(client.send.getCalls().length, 5);

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/000000000000.json',
        Body: JSON.stringify(model.toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Body: JSON.stringify(models.getRawSearchIndex(MainModel)),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index.json',
        Body: JSON.stringify(models.getSearchIndex(MainModel)),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/LinkedModel/000000000000.json',
        Body: JSON.stringify(model.linked.toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));
});

test('S3Engine.find(MainModel, {string: "test"}) when a matching model exists', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const client = stubS3Client({}, {
        'test-bucket': Object.values(models.models),
    });

    const found = await S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).find(MainModel, {string: 'test'});

    t.like(found, [model.toIndexData()]);
});

test('S3Engine.find(MainModel, {string: "test"}) when a matching model does not exist', async t => {
    const client = stubS3Client({'test-bucket': {'MainModel/_index.json': {}}});

    const models = await S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).find(MainModel, {string: 'test'});

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/MainModel/_index.json',
        Bucket: 'test-bucket',
    }));

    t.deepEqual(models, []);
});

test('S3Engine.find(MainModel, {string: "test"}) when no index exists', async t => {
    const client = stubS3Client();

    const models = await S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).find(MainModel, {string: 'test'});

    t.deepEqual(models, []);
});

test('S3Engine.search(MainModel, "test") when matching models exist', async t => {
    const models = new Models();
    const model1 = models.createFullTestModel();
    const model2 = models.createFullTestModel();

    model2.string = 'moving tests';

    const client = stubS3Client({}, {
        'test-bucket': Object.values(models.models),
    });

    const configuration = {
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    };

    const found = await S3Engine.configure(configuration).search(MainModel, 'test');

    t.like(found, [{
        ref: 'MainModel/000000000000',
        score: 0.666,
        model: model1.toData(false),
    }, {
        ref: 'MainModel/000000000001',
        score: 0.506,
        model: model2.toData(false),
    }]);
});

test('S3Engine.search(MainModel, "not-even-close-to-a-match") when no matching model exists', async t => {
    const models = new Models();
    models.createFullTestModel();
    models.createFullTestModel();

    const client = stubS3Client({}, {
        'test-bucket': Object.values(models.models),
    });

    const configuration = {
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    };

    const found = await S3Engine.configure(configuration).search(MainModel, 'not-even-close-to-a-match');

    t.deepEqual(found, []);
});

test('S3Engine.search(MainModel, "test") when no search index exists for the model', async t => {
    const client = stubS3Client({}, {});

    const configuration = {
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    };

    await t.throwsAsync(() =>  S3Engine.configure(configuration).search(MainModel, 'test'), {
        instanceOf: EngineError,
        message: 'The model MainModel does not have a search index available.',
    });
});

test('S3Engine.hydrate(model)', async t => {
    const models = new Models();
    const model = models.createFullTestModel();

    const dryModel = new MainModel();
    dryModel.id = 'MainModel/000000000000';

    const client = stubS3Client({}, {'test-bucket': Object.values(models.models)});

    const hydratedModel = await S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).hydrate(dryModel);

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Bucket: 'test-bucket',
        Key: 'test/MainModel/000000000000.json',
    }));
    assertions.calledWith(t, client.send, new GetObjectCommand({
        Bucket: 'test-bucket',
        Key: 'test/CircularModel/000000000000.json',
    }));
    assertions.calledWith(t, client.send, new GetObjectCommand({
        Bucket: 'test-bucket',
        Key: 'test/LinkedModel/000000000000.json',
    }));
    assertions.calledWith(t, client.send, new GetObjectCommand({
        Bucket: 'test-bucket',
        Key: 'test/LinkedModel/000000000001.json',
    }));
    assertions.calledWith(t, client.send, new GetObjectCommand({
        Bucket: 'test-bucket',
        Key: 'test/LinkedManyModel/000000000000.json',
    }));
    assertions.calledWith(t, client.send, new GetObjectCommand({
        Bucket: 'test-bucket',
        Key: 'test/CircularManyModel/000000000000.json',
    }));

    t.is(client.send.getCalls().length, 6);
    t.deepEqual(hydratedModel, model);
});
