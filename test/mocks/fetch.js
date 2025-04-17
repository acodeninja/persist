import Model from '../../src/data/Model.js';
import {jest} from '@jest/globals';

/**
 * @param models
 * @param prefix
 * @return {void|*}
 */
function stubFetch(models, prefix = '') {
    const modelsAddedToFilesystem = [];

    /**
     * @param initialFilesystem
     * @param initialModels
     * @return {object}
     */
    function fileSystemFromModels(initialFilesystem, ...initialModels) {
        for (const model of initialModels) {
            const modelIndexPath = [prefix, model.id.replace(/\/[A-Z0-9]+$/, '')].filter(Boolean).join('/');
            const searchIndexRawPath = [prefix, model.id.replace(/[A-Z0-9]+$/, 'search')].filter(Boolean).join('/');

            const modelIndex = initialFilesystem[modelIndexPath] || {};
            initialFilesystem[[prefix, model.id].filter(Boolean).join('/')] = model.toData();
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

            for (const [_property, value] of Object.entries(model)) {
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

    const resolvedFiles = fileSystemFromModels({}, ...models);

    const stubbedFetch = jest.fn().mockImplementation((url, opts) => {
        if (opts.method === 'PUT') {
            resolvedFiles[url.pathname] = JSON.parse(opts.body);
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({}),
            });
        }

        if (opts.method === 'DELETE') {
            for (const [path, _value] of Object.entries(resolvedFiles)) {
                if (url.pathname.endsWith(path)) {
                    delete resolvedFiles[url.pathname];
                    return Promise.resolve({
                        ok: true,
                        status: 204,
                        json: () => Promise.resolve(),
                    });
                }
            }

            return Promise.resolve({
                ok: false,
                status: 404,
            });
        }

        for (const [filename, value] of Object.entries(resolvedFiles)) {
            if (url.pathname.endsWith(filename)) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json:() => Promise.resolve(value),
                });
            }
        }

        return Promise.resolve({
            ok: false,
            status: 404,
        });
    });

    stubbedFetch.resolvedFiles = resolvedFiles;

    return stubbedFetch;
}

export default stubFetch;
