import {InvalidRequest, NoSuchBucket, NoSuchKey} from '@aws-sdk/client-s3';
import {describe, expect, jest, test} from '@jest/globals';
import Model from '../../src/data/Model.js';

/**
 * @param data
 * @return {{Body: {transformToString: (function(): Promise<Awaited<string>>)}}}
 * @constructor
 */
function S3ObjectWrapper(data) {
    return {
        Body: {
            transformToString: () => Promise.resolve(data.toString()),
        },
    };
}

/**
 * Create a mock S3 client that allows testing the S3StorageEngine integration.
 * @param {Record<string, Array<Model>>} models
 * @return {{send: (*|void)}}
 */
function stubS3Client(models) {
    const modelsAddedToFilesystem = [];

    /**
     * @param initialFilesystem
     * @param initialModels
     * @return {object}
     */
    function bucketFilesFromModels(initialFilesystem = {}, ...initialModels) {
        for (const model of initialModels) {
            const modelIndexPath = model.id.replace(/[A-Z0-9]+$/, '_index.json');
            const modelIndex = initialFilesystem[modelIndexPath];
            initialFilesystem[`${model.id}.json`] = model.toData();
            initialFilesystem[modelIndexPath] = {
                ...modelIndex,
                [model.id]: model.toIndexData(),
            };
            modelsAddedToFilesystem.push(model.id);

            const searchIndexRawPath = model.id.replace(/[A-Z0-9]+$/, '_search_index.json');

            if (model.constructor.searchProperties().length > 0) {
                const searchIndex = initialFilesystem[searchIndexRawPath] || {};
                initialFilesystem[searchIndexRawPath] = {
                    ...searchIndex,
                    [model.id]: model.toSearchData(),
                };
            }

            for (const [_property, value] of Object.entries(model)) {
                if (Model.isModel(value) && !modelsAddedToFilesystem.includes(value.id)) {
                    initialFilesystem = bucketFilesFromModels(initialFilesystem, value);
                }

                if (Array.isArray(value)) {
                    for (const [_subProperty, subModel] of Object.entries(value)) {
                        if (Model.isModel(subModel) && !modelsAddedToFilesystem.includes(subModel.id)) {
                            initialFilesystem = bucketFilesFromModels(initialFilesystem, subModel);
                        }
                    }
                }
            }
        }
        return initialFilesystem;
    }

    const resolvedBuckets = {};

    for (const [bucket, modelList] of Object.entries(models)) {
        const resolvedFiles = bucketFilesFromModels(resolvedBuckets[bucket], ...modelList);

        resolvedBuckets[bucket] = {
            ...(resolvedBuckets[bucket] || {}),
            ...resolvedFiles,
        };
    }

    const send = jest.fn().mockImplementation((command) => {
        switch (command?.constructor?.name) {
            case 'GetObjectCommand':
                if (resolvedBuckets[command.input.Bucket]) {
                    for (const [filename, value] of Object.entries(resolvedBuckets[command.input.Bucket])) {
                        if (command.input.Key.endsWith(filename)) {
                            if (typeof value === 'string') {
                                return Promise.resolve(S3ObjectWrapper(Buffer.from(value)));
                            }
                            return Promise.resolve(S3ObjectWrapper(Buffer.from(JSON.stringify(value))));
                        }
                    }
                    return Promise.reject(new NoSuchKey({}));
                }
                return Promise.reject(new NoSuchBucket({}));
            case 'PutObjectCommand':
                resolvedBuckets[command.input.Bucket] = {
                    ...resolvedBuckets[command.input.Bucket],
                    [command.input.Key]: command.input.Body,
                };
                return Promise.resolve(null);
            case 'DeleteObjectCommand':
                for (const [filename, _] of Object.entries(resolvedBuckets[command.input.Bucket])) {
                    if (command.input.Key.endsWith(filename)) {
                        delete resolvedBuckets[command.input.Bucket][filename];
                        return Promise.resolve();
                    }
                }
                return Promise.reject(new NoSuchKey({}));
            default:
                return Promise.reject(new InvalidRequest({}));
        }
    });

    return {send, resolvedBuckets};
}

export default stubS3Client;

describe('S3Mock', () => {
    test('throws an error for an unknown command', async () => {
        await expect(() => stubS3Client([]).send({})).rejects.toThrow(InvalidRequest);
    });
});
