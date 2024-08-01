import Model from '../../src/type/Model.js';
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
        resolvedBuckets[bucket] = {
            ...(resolvedBuckets[bucket] || {}),
            ...bucketFilesFromModels(resolvedBuckets[bucket], ...modelList),
        }
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
