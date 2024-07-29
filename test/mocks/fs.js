import Model from '../../src/type/Model.js';
import sinon from 'sinon';

function stubFs(filesystem, models = []) {
    const modelsAddedToFilesystem = [];

    function fileSystemFromModels(initialFilesystem = {}, ...models) {
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
                    initialFilesystem = fileSystemFromModels(initialFilesystem, value);
                }

                if (Array.isArray(value)) {
                    for (const [_, subModel] of Object.entries(value)) {
                        if (Model.isModel(subModel) && !modelsAddedToFilesystem.includes(subModel.id)) {
                            initialFilesystem = fileSystemFromModels(initialFilesystem, subModel);
                        }
                    }
                }
            }
        }
        return initialFilesystem;
    }

    const resolvedFiles = fileSystemFromModels(filesystem, ...models);

    const readFile = sinon.stub().callsFake(async (filePath) => {
        for (const [filename, value] of Object.entries(resolvedFiles)) {
            if (filePath.endsWith(filename)) {
                if (typeof value === 'string') {
                    return Buffer.from(value);
                }
                return Buffer.from(JSON.stringify(value));
            }
        }

        const err = new Error(`ENOENT: no such file or directory, open '${filePath}'`)
        err.code = 'EPIPE'
        err.errno = -3
        throw err;
    });

    const writeFile = sinon.stub().callsFake(async () => {

    });

    const mkdir = sinon.stub().callsFake(async () => {

    });

    return {readFile, writeFile, mkdir};
}

export default stubFs;
