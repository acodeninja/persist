import {GetObjectCommand, InvalidRequest, NoSuchKey, S3Client} from '@aws-sdk/client-s3';
import {MisconfiguredStorageEngineError, ModelNotFoundStorageEngineError} from './StorageEngine.js';
import {SimpleModelFactory, SimpleModelWithSearchIndexFactory} from '../../../test/fixtures/Model.js';
import {beforeAll, describe, expect, jest, test} from '@jest/globals';
import S3StorageEngine from './S3StorageEngine.js';

describe('new S3StorageEngine', () => {
    describe('when no configuration is provided', () => {
        test('throws a misconfigured error', () => {
            expect(() => new S3StorageEngine({}, [])).toThrow({
                instanceOf: MisconfiguredStorageEngineError,
                message: 'Incorrect configuration given for storage engine S3StorageEngine: both bucket and client must be provided',
            });
        });
    });

    describe('when required configuration is provided', () => {
        test('throws a misconfigured error', () => {
            expect(() => new S3StorageEngine({
                bucket: 's3-bucket',
                client: new S3Client({}),
            }, [])).not.toThrow();
        });
    });
});

describe('S3StorageEngine.getModel()', () => {
    describe('when a model exists', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockImplementation(command => {
            if (command instanceof GetObjectCommand && command.input.Key.endsWith(`${model.id}.json`)) {
                return Promise.resolve({
                    Body: {
                        transformToString: () => Promise.resolve(JSON.stringify(model.toData())),
                    },
                });
            }

            return Promise.reject(new InvalidRequest({}));
        });
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        test('returns an object with the model data', async () => {
            expect(await engine.getModel(model.id)).toEqual(model.toData());
        });

        test('calls client.send with the model id', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.id}.json`,
                },
            }));
        });
    });

    describe('when a model does not exist', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockRejectedValue(new NoSuchKey());
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        test('throws ModelNotFoundStorageEngineError', async () => {
            await expect(() => engine.getModel(model.id)).rejects.toThrow({
                instanceOf: ModelNotFoundStorageEngineError,
                message: `The model ${model.id} was not found`,
            });
        });

        test('calls client.send with the model id', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.id}.json`,
                },
            }));
        });
    });

    describe('when an unknown error occurs', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockRejectedValue(new Error('unknown'));
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        test('throws the received error', async () => {
            await expect(() => engine.getModel(model.id)).rejects.toThrow({
                instanceOf: Error,
                message: 'unknown',
            });
        });

        test('calls client.send with the model id', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.id}.json`,
                },
            }));
        });
    });
});

describe('S3StorageEngine.putModel()', () => {
    describe('when no error occurs', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockResolvedValue(null);
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        beforeAll(() => engine.putModel(model.toData()));

        test('calls client.send with the model id', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.id}.json`,
                    Body: JSON.stringify(model.toData()),
                    ContentType: 'application/json',
                },
            }));
        });
    });

    describe('when an unknown error occurs', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockRejectedValue(new Error('unknown'));
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        test('throws the error', async () => {
            await expect(() => engine.putModel(model.toData())).rejects.toThrow({
                instanceOf: Error,
                message: 'unknown',
            });
        });

        test('calls client.send with the model id', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.id}.json`,
                    Body: JSON.stringify(model.toData()),
                    ContentType: 'application/json',
                },
            }));
        });
    });
});

describe('S3StorageEngine.deleteModel()', () => {
    describe('when no error occurs', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockResolvedValue(null);
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        beforeAll(() => engine.deleteModel(model.id));

        test('calls client.send with the model id', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.id}.json`,
                },
            }));
        });
    });

    describe('when a model does not exist', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockRejectedValue(new NoSuchKey());
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        test('throws ModelNotFoundStorageEngineError', async () => {
            await expect(() => engine.deleteModel(model.id)).rejects.toThrow({
                instanceOf: ModelNotFoundStorageEngineError,
                message: `The model ${model.id} was not found`,
            });
        });

        test('calls client.send with the model id', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.id}.json`,
                },
            }));
        });
    });

    describe('when an unknown error occurs', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockRejectedValue(new Error('unknown'));
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        test('throws the received error', async () => {
            await expect(() => engine.deleteModel(model.id)).rejects.toThrow({
                instanceOf: Error,
                message: 'unknown',
            });
        });

        test('calls client.send with the model id', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.id}.json`,
                },
            }));
        });
    });
});

describe('S3StorageEngine.getIndex()', () => {
    describe('when an index exists', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockImplementation(command => {
            if (command instanceof GetObjectCommand && command.input.Key.endsWith('_index.json')) {
                return Promise.resolve({
                    Body: {
                        transformToString: () => Promise.resolve(JSON.stringify({
                            [model.id]: model.toIndexData(),
                        })),
                    },
                });
            }

            return Promise.reject(new InvalidRequest({}));
        });
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        test('returns an object with the index data', async () => {
            expect(await engine.getIndex(model.constructor)).toEqual({
                [model.id]: model.toIndexData(),
            });
        });

        test('calls client.send with the model constructor', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.constructor.name}/_index.json`,
                },
            }));
        });
    });

    describe('when an index does not exist', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockRejectedValue(new NoSuchKey());
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        test('returns an empty index', async () => {
            expect(await engine.getIndex(model.constructor)).toEqual({});
        });

        test('calls client.send with the model id', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.constructor.name}/_index.json`,
                },
            }));
        });
    });
});

describe('S3StorageEngine.putIndex()', () => {
    describe('when no error occurs', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockResolvedValue(null);
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        beforeAll(() => engine.putIndex(model.constructor, {[model.id]: model.toIndexData()}));

        test('calls client.send with the model constructor', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.constructor.name}/_index.json`,
                    Body: JSON.stringify({[model.id]: model.toIndexData()}),
                    ContentType: 'application/json',
                },
            }));
        });
    });

    describe('when an error occurs', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockRejectedValue(new Error('unknown'));
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        test('throws the error', async () => {
            await expect(() =>
                engine.putIndex(model.constructor, {[model.id]: model.toIndexData()}),
            ).rejects.toThrow({
                instanceOf: Error,
                message: 'unknown',
            });
        });

        test('calls client.send with the model id', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.constructor.name}/_index.json`,
                    Body: JSON.stringify({[model.id]: model.toIndexData()}),
                    ContentType: 'application/json',
                },
            }));
        });
    });
});

describe('S3StorageEngine.getSearchIndex()', () => {
    describe('when an index exists', () => {
        const model = SimpleModelWithSearchIndexFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockImplementation(command => {
            if (command instanceof GetObjectCommand && command.input.Key.endsWith('_search_index.json')) {
                return Promise.resolve({
                    Body: {
                        transformToString: () => Promise.resolve(JSON.stringify({
                            [model.id]: model.toSearchData(),
                        })),
                    },
                });
            }

            return Promise.reject(new InvalidRequest({}));
        });
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        test('returns the model\'s search index', async () => {
            expect(await engine.getSearchIndex(model.constructor)).toEqual({
                [model.id]: model.toSearchData(),
            });
        });

        test('calls client.send with the model constructor', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.constructor.name}/_search_index.json`,
                },
            }));
        });
    });

    describe('when an index does not exist', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockRejectedValue(new NoSuchKey());
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        test('returns an empty index', async () => {
            expect(await engine.getSearchIndex(model.constructor)).toEqual({});
        });

        test('calls client.send with the model id', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.constructor.name}/_search_index.json`,
                },
            }));
        });
    });
});

describe('S3StorageEngine.putSearchIndex()', () => {
    describe('when no error occurs', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockResolvedValue(null);
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        beforeAll(() => engine.putSearchIndex(model.constructor, {[model.id]: model.toIndexData()}));

        test('calls client.send with the model constructor', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.constructor.name}/_search_index.json`,
                    Body: JSON.stringify({[model.id]: model.toIndexData()}),
                    ContentType: 'application/json',
                },
            }));
        });
    });

    describe('when an error occurs', () => {
        const model = SimpleModelFactory();
        const client = new S3Client();
        jest.spyOn(client, 'send').mockRejectedValue(new Error('unknown'));
        const engine = new S3StorageEngine({
            bucket: 's3-bucket',
            client,
        }, []);

        test('throws the error', async () => {
            await expect(() =>
                engine.putSearchIndex(model.constructor, {[model.id]: model.toSearchData()}),
            ).rejects.toThrow({
                instanceOf: Error,
                message: 'unknown',
            });
        });

        test('calls client.send with the model id', () => {
            expect(client.send).toHaveBeenCalledWith(expect.objectContaining({
                input: {
                    Bucket: 's3-bucket',
                    Key: `${model.constructor.name}/_search_index.json`,
                    Body: JSON.stringify({[model.id]: model.toSearchData()}),
                    ContentType: 'application/json',
                },
            }));
        });
    });
});
