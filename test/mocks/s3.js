import Model from '../../src/type/Model.js';
import lunr from 'lunr';
import sinon from 'sinon';

function S3ObjectWrapper(data) {
    return {
        Body: {
            transformToString: async () => {
                return data.toString();
            },
        },
    };
}

function stubS3Client(filesystem = {}, models = {}) {
    const modelsAddedToFilesystem = [];

    function bucketFilesFromModels(initialFilesystem = {}, ...models) {
        for (const model of models) {
            const modelIndexPath = model.id.replace(/[A-Z0-9]+$/, '_index.json');
            const modelIndex = initialFilesystem[modelIndexPath];
            initialFilesystem[model.id + '.json'] = model.toData();
            initialFilesystem[modelIndexPath] = {
                ...modelIndex,
                [model.id]: model.toIndexData(),
            };
            modelsAddedToFilesystem.push(model.id);

            const searchIndexRawPath = model.id.replace(/[A-Z0-9]+$/, '_search_index_raw.json');

            if (model.constructor.searchProperties().length > 0) {
                const searchIndex = initialFilesystem[searchIndexRawPath] || {};
                initialFilesystem[searchIndexRawPath] = {
                    ...searchIndex,
                    [model.id]: model.toSearchData(),
                };
            }

            for (const [_, value] of Object.entries(model)) {
                if (Model.isModel(value) && !modelsAddedToFilesystem.includes(value.id)) {
                    initialFilesystem = bucketFilesFromModels(initialFilesystem, value);
                }

                if (Array.isArray(value)) {
                    for (const [_, subModel] of Object.entries(value)) {
                        if (Model.isModel(subModel) && !modelsAddedToFilesystem.includes(subModel.id)) {
                            initialFilesystem = bucketFilesFromModels(initialFilesystem, subModel);
                        }
                    }
                }
            }
        }
        return initialFilesystem;
    }

    const resolvedBuckets = filesystem;

    for (const [bucket, modelList] of Object.entries(models)) {
        const resolvedFiles = bucketFilesFromModels(resolvedBuckets[bucket], ...modelList);

        const searchIndexes = Object.entries(resolvedFiles)
            .filter(([name, _]) => name.endsWith('_search_index_raw.json'));

        if (searchIndexes.length > 0) {
            for (const [name, index] of searchIndexes) {
                const fields = [...new Set(Object.values(index).map(i => Object.keys(i).filter(i => i !== 'id')).flat(Infinity))];
                const compiledIndex = lunr(function () {
                    this.ref('id');

                    for (const field of fields) {
                        this.field(field);
                    }

                    Object.values(index).forEach(function (doc) {
                        this.add(doc);
                    }, this);
                });

                resolvedFiles[name.replace('_raw', '')] = compiledIndex;
            }
        }

        resolvedBuckets[bucket] = {
            ...(resolvedBuckets[bucket] || {}),
            ...resolvedFiles,
        };
    }

    const send = sinon.stub().callsFake(async (command) => {
        switch (command.constructor.name) {
            case 'GetObjectCommand':
                if (resolvedBuckets[command.input.Bucket]) {
                    for (const [filename, value] of Object.entries(resolvedBuckets[command.input.Bucket])) {
                        if (command.input.Key.endsWith(filename)) {
                            if (typeof value === 'string') {
                                return S3ObjectWrapper(Buffer.from(value));
                            }
                            return S3ObjectWrapper(Buffer.from(JSON.stringify(value)));
                        }
                    }
                }
                break;
            case 'PutObjectCommand':
                break;
        }
    });

    return {send};
}

export default stubS3Client;
