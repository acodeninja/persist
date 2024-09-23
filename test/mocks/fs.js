import Model from '../../src/type/Model.js';
import lunr from 'lunr';
import sinon from 'sinon';

function stubFs(filesystem = {}, models = []) {
    const modelsAddedToFilesystem = [];

    function fileSystemFromModels(initialFilesystem = {}, ...initialModels) {
        for (const model of initialModels) {
            const modelIndexPath = model.id.replace(/[A-Z0-9]+$/, '_index.json');
            const searchIndexRawPath = model.id.replace(/[A-Z0-9]+$/, '_search_index_raw.json');

            const modelIndex = initialFilesystem[modelIndexPath] || {};
            initialFilesystem[model.id + '.json'] = model.toData();
            initialFilesystem[modelIndexPath] = {
                ...modelIndex,
                [model.id]: model.toIndexData(),
            };

            if (model.constructor.searchProperties().length > 0) {
                const searchIndex = initialFilesystem[searchIndexRawPath] || {};
                initialFilesystem[searchIndexRawPath] = {
                    ...searchIndex,
                    [model.id]: model.toSearchData(),
                };
            }

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

    const searchIndexes = Object.entries(resolvedFiles)
        .filter(([name, _]) => name.endsWith('_search_index_raw.json'));

    if (searchIndexes.length > 0) {
        for (const [name, index] of searchIndexes) {
            const fields = [...new Set(Object.values(index).map(i => Object.keys(i).filter(i => i !== 'id')).flat(Infinity))];
            resolvedFiles[name.replace('_raw', '')] = lunr(function () {
                this.ref('id');

                for (const field of fields) {
                    this.field(field);
                }

                Object.values(index).forEach(function (doc) {
                    this.add(doc);
                }, this);
            });
        }
    }

    const readFile = sinon.stub().callsFake(async (filePath) => {
        for (const [filename, value] of Object.entries(resolvedFiles)) {
            if (filePath.endsWith(filename)) {
                if (typeof value === 'string') {
                    return Buffer.from(value);
                }
                return Buffer.from(JSON.stringify(value));
            }
        }

        const err = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
        err.code = 'EPIPE';
        err.errno = -3;
        throw err;
    });

    const writeFile = sinon.stub().callsFake(async () => {

    });

    const mkdir = sinon.stub().callsFake(async () => {

    });

    return {readFile, writeFile, mkdir};
}

export default stubFs;
