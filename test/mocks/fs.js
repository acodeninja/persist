import Model from '../../src/type/Model.js';
import {jest} from '@jest/globals';
import lunr from 'lunr';

/**
 * @param filesystem
 * @param models
 * @return {{readFile: (*|void), writeFile: *, mkdir: *}}
 */
function stubFs(filesystem = {}, models = []) {
    const modelsAddedToFilesystem = [];

    /**
     * @param initialFilesystem
     * @param initialModels
     * @return {object}
     */
    function fileSystemFromModels(initialFilesystem = {}, ...initialModels) {
        for (const model of initialModels) {
            const modelIndexPath = model.id.replace(/[A-Z0-9]+$/, '_index.json');
            const searchIndexRawPath = model.id.replace(/[A-Z0-9]+$/, '_search_index_raw.json');

            const modelIndex = initialFilesystem[modelIndexPath] || {};
            initialFilesystem[`${model.id}.json`] = model.toData();
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

            for (const [_proptery, value] of Object.entries(model)) {
                if (Model.isModel(value) && !modelsAddedToFilesystem.includes(value.id)) {
                    initialFilesystem = fileSystemFromModels(initialFilesystem, value);
                }

                if (Array.isArray(value)) {
                    for (const [_subProperty, subModel] of Object.entries(value)) {
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
            const fields = [...new Set(Object.values(index).map(i => Object.keys(i).filter(p => p !== 'id')).flat(Infinity))];
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

    resolvedFiles['_index.json'] = {
        ...resolvedFiles['_index.json'] || {},
        ...Object.fromEntries(models.map(m => ([m.id, m.toIndexData()]))),
    };

    const readFile = jest.fn().mockImplementation((filePath) => {
        const path = filePath.replace('/tmp/fileEngine/', '');
        if (resolvedFiles[path]) {
            if (typeof resolvedFiles[path] === 'string') {
                return Promise.resolve(Buffer.from(resolvedFiles[path]));
            }
            return Promise.resolve(Buffer.from(JSON.stringify(resolvedFiles[path])));
        }

        const err = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
        err.code = 'EPIPE';
        err.errno = -3;
        return Promise.reject(err);
    });

    const rm = jest.fn().mockImplementation((filePath) => {
        for (const [filename, _] of Object.entries(resolvedFiles)) {
            if (filePath.endsWith(filename)) {
                delete resolvedFiles[filename];
                return Promise.resolve();
            }
        }

        const err = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
        err.code = 'EPIPE';
        err.errno = -3;
        return Promise.reject(err);
    });

    const writeFile = jest.fn().mockImplementation((filePath, contents) => {
        const path = filePath.replace('/tmp/fileEngine/', '');
        if (resolvedFiles[path]) {
            resolvedFiles[path] = contents;
        }
        return Promise.resolve();
    });

    const mkdir = jest.fn();

    return {readFile, rm, writeFile, mkdir, resolvedFiles};
}

export default stubFs;
