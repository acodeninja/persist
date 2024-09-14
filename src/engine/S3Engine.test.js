import {EngineError, MissConfiguredError, NotFoundEngineError} from './Engine.js';
import {GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3';
import {MainModel, getTestModelInstance, valid} from '../../test/fixtures/TestModel.js';
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

    t.is(originalStore._configuration, undefined);
    t.like(configuredStore._configuration, {
        bucket: 'test-bucket',
        prefix: 'test',
    });
});

test('S3Engine.get(MainModel, id) when engine is not configured', async t => {
    const error = await t.throwsAsync(
        async () => await S3Engine.get(MainModel, 'MainModel/000000000000'),
        {
            instanceOf: MissConfiguredError,
        },
    );

    t.is(error.message, 'Engine is miss-configured');
});

test('S3Engine.get(MainModel, id) when id exists', async t => {
    const client = stubS3Client({
        'test-bucket': {
            'test/MainModel/000000000000.json': getTestModelInstance(valid).toData(),
        },
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
    t.like(model.toData(), {
        ...valid,
        stringSlug: 'string',
        requiredStringSlug: 'required-string',
    });
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

    const model = getTestModelInstance(valid);
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
        Body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
                stringSlug: 'string',
                linked: {string: 'test'},
                linkedMany: [{string: 'many'}],
            },
        }),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
            },
        }),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index.json',
        Body: JSON.stringify({
            version: '2.3.9',
            fields: ['string'],
            fieldVectors: [['string/MainModel/000000000000', [0, 0.288]]],
            invertedIndex: [['string', {_index: 0, string: {'MainModel/000000000000': {}}}]],
            pipeline: ['stemmer'],
        }),
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
        Key: 'test/LinkedModel/111111111111.json',
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
        Body: JSON.stringify({
            'LinkedModel/000000000000': {id: 'LinkedModel/000000000000'},
            'LinkedModel/111111111111': {id: 'LinkedModel/111111111111'},
        }),
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
        Body: JSON.stringify({
            'LinkedManyModel/000000000000': {id: 'LinkedManyModel/000000000000'},
        }),
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
        Body: JSON.stringify({
            'CircularModel/000000000000': {id: 'CircularModel/000000000000'},
        }),
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
        Body: JSON.stringify({
            'CircularManyModel/000000000000': {id: 'CircularManyModel/000000000000'},
        }),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
                stringSlug: 'string',
                linked: {string: 'test'},
                linkedMany: [{string: 'many'}],
            },
            'CircularModel/000000000000': {id: 'CircularModel/000000000000'},
            'LinkedModel/000000000000': {id: 'LinkedModel/000000000000'},
            'LinkedModel/111111111111': {id: 'LinkedModel/111111111111'},
            'CircularManyModel/000000000000': {id: 'CircularManyModel/000000000000'},
            'LinkedManyModel/000000000000': {id: 'LinkedManyModel/000000000000'},
        }),
    }));
});

test('S3Engine.put(model) updates existing search indexes', async t => {
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

    const model = getTestModelInstance(valid);
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
        Body: JSON.stringify({
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
            },
        }),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index.json',
        Body: JSON.stringify({
            version: '2.3.9',
            fields: ['string'],
            fieldVectors: [['string/MainModel/111111111111', [0, 0.182]], ['string/MainModel/000000000000', [0, 0.182]]],
            invertedIndex: [['string', {
                _index: 0,
                string: {'MainModel/111111111111': {}, 'MainModel/000000000000': {}},
            }]],
            pipeline: ['stemmer'],
        }),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));
});

test('S3Engine.put(model) updates existing indexes', async t => {
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

    const model = getTestModelInstance(valid);

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
        Body: JSON.stringify({
            'MainModel/111111111111': {
                id: 'MainModel/111111111111',
                string: 'String',
            },
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
                stringSlug: 'string',
                linked: {string: 'test'},
                linkedMany: [{string: 'many'}],
            },
        }),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/LinkedModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/LinkedModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify({
            'LinkedModel/000000000000': {id: 'LinkedModel/000000000000'},
            'LinkedModel/111111111111': {id: 'LinkedModel/111111111111'},
        }),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/LinkedManyModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/LinkedManyModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify({
            'LinkedManyModel/000000000000': {id: 'LinkedManyModel/000000000000'},
        }),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/CircularModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/CircularModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify({
            'CircularModel/000000000000': {id: 'CircularModel/000000000000'},
        }),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/CircularManyModel/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/CircularManyModel/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify({
            'CircularManyModel/000000000000': {id: 'CircularManyModel/000000000000'},
        }),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/_index.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/_index.json',
        Bucket: 'test-bucket',
        ContentType: 'application/json',
        Body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
                stringSlug: 'string',
                linked: {string: 'test'},
                linkedMany: [{string: 'many'}],
            },
            'CircularModel/000000000000': {id: 'CircularModel/000000000000'},
            'LinkedModel/000000000000': {id: 'LinkedModel/000000000000'},
            'LinkedModel/111111111111': {id: 'LinkedModel/111111111111'},
            'CircularManyModel/000000000000': {id: 'CircularManyModel/000000000000'},
            'LinkedManyModel/000000000000': {id: 'LinkedManyModel/000000000000'},
        }),
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

    client.send.callsFake(async command => {
        if (command.input.Key.endsWith('_search_index.json')) {
            throw new Error();
        }
    });

    const model = getTestModelInstance(valid);

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
        Body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
            },
        }),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index.json',
        Body: JSON.stringify({
            version: '2.3.9',
            fields: ['string'],
            fieldVectors: [['string/MainModel/000000000000', [0, 0.288]]],
            invertedIndex: [['string', {_index: 0, string: {'MainModel/000000000000': {}}}]],
            pipeline: ['stemmer'],
        }),
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

    client.send.callsFake(async command => {
        if (command.input.Key.endsWith('_search_index_raw.json')) {
            throw new Error();
        }
    });

    const model = getTestModelInstance(valid);

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
        Body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
            },
        }),
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

    client.send.callsFake(async command => {
        if (command.input.Key.endsWith('/_index.json')) {
            throw new Error();
        }
    });

    const model = getTestModelInstance(valid);

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
        Body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
                stringSlug: 'string',
                linked: {string: 'test'},
                linkedMany: [{string: 'many'}],
            },
        }),
    }));

    assertions.calledWith(t, client.send, new GetObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Bucket: 'test-bucket',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index_raw.json',
        Body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
            },
        }),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index.json',
        Body: JSON.stringify({
            version: '2.3.9',
            fields: ['string'],
            fieldVectors: [['string/MainModel/000000000000', [0, 0.288]]],
            invertedIndex: [['string', {_index: 0, string: {'MainModel/000000000000': {}}}]],
            pipeline: ['stemmer'],
        }),
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
        Key: 'test/LinkedModel/111111111111.json',
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
    const model = getTestModelInstance(valid);

    client.send.callsFake(async command => {
        if (command.input.Key.endsWith('MainModel/000000000000.json')) {
            throw new Error();
        }
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
    const model = getTestModelInstance(valid);

    client.send.callsFake(async command => {
        if (command.input.Key.endsWith('LinkedModel/000000000000.json')) {
            throw new Error();
        }
    });

    await t.throwsAsync(() => S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).put(model), {
        instanceOf: EngineError,
        message: 'Failed to put s3://test-bucket/test/LinkedModel/000000000000.json',
    });

    t.is(client.send.getCalls().length, 6);

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
        Body: JSON.stringify({
            'MainModel/000000000000': {
                id: 'MainModel/000000000000',
                string: 'String',
            },
        }),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));

    assertions.calledWith(t, client.send, new PutObjectCommand({
        Key: 'test/MainModel/_search_index.json',
        Body: JSON.stringify({
            version: '2.3.9',
            fields: ['string'],
            fieldVectors: [['string/MainModel/000000000000', [0, 0.288]]],
            invertedIndex: [['string', {_index: 0, string: {'MainModel/000000000000': {}}}]],
            pipeline: ['stemmer'],
        }),
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
        Key: 'test/CircularModel/000000000000.json',
        Body: JSON.stringify(model.circular.toData()),
        Bucket: 'test-bucket',
        ContentType: 'application/json',
    }));
});

test('S3Engine.find(MainModel, {string: "test"}) when a matching model exists', async t => {
    const client = stubS3Client({}, {
        'test-bucket': [
            getTestModelInstance(valid),
            getTestModelInstance({
                id: 'MainModel/1111111111111',
                string: 'another string',
            }),
        ],
    });

    const models = await S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).find(MainModel, {string: 'String'});

    t.like(models, [{id: 'MainModel/000000000000', string: 'String'}]);
});

test('S3Engine.find(MainModel, {string: "test"}) when a matching model does not exist', async t => {
    const client = stubS3Client({'test-bucket': {'MainModel/_index.json': {}}});

    const models = await S3Engine.configure({
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    }).find(MainModel, {string: 'String'});

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
    }).find(MainModel, {string: 'String'});

    t.deepEqual(models, []);
});

test('S3Engine.search(MainModel, "Str") when a matching model exists', async t => {
    const client = stubS3Client({}, {
        'test-bucket': [
            getTestModelInstance(valid),
            getTestModelInstance({
                id: 'MainModel/1111111111111',
                string: 'another string',
            }),
        ],
    });

    const configuration = {
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    };

    const model0 = await S3Engine.configure(configuration).get(MainModel, 'MainModel/000000000000');

    const model1 = await S3Engine.configure(configuration).get(MainModel, 'MainModel/1111111111111');

    const models = await S3Engine.configure(configuration).search(MainModel, 'Str');

    t.like(models, [{
        ref: 'MainModel/000000000000',
        score: 0.211,
        model: model0,
    }, {
        ref: 'MainModel/1111111111111',
        score: 0.16,
        model: model1,
    }]);
});

test('S3Engine.search(MainModel, "not-even-close-to-a-match") when no matching model exists', async t => {
    const client = stubS3Client({}, {
        'test-bucket': [
            getTestModelInstance(valid),
            getTestModelInstance({
                id: 'MainModel/1111111111111',
                string: 'another string',
            }),
        ],
    });

    const configuration = {
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    };

    const models = await S3Engine.configure(configuration).search(MainModel, 'not-even-close-to-a-match');

    t.deepEqual(models, []);
});

test('S3Engine.search(MainModel, "Str") when no index exists for the model', async t => {
    const client = stubS3Client({}, {});

    const configuration = {
        bucket: 'test-bucket',
        prefix: 'test',
        client,
    };

    await t.throwsAsync(async () => await S3Engine.configure(configuration).search(MainModel, 'Str'), {
        instanceOf: EngineError,
        message: 'The model MainModel does not have a search index available.',
    });
});

test('S3Engine.hydrate(model)', async t => {
    const model = getTestModelInstance(valid);

    const dryModel = new MainModel();
    dryModel.id = 'MainModel/000000000000';

    const client = stubS3Client({}, {'test-bucket': [model]});

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
        Key: 'test/LinkedModel/111111111111.json',
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
