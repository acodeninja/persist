import Model from '../../src/type/Model.js';
import lunr from 'lunr';
import sinon from 'sinon';

function stubFetch(filesystem = {}, models = [], errors = {}, prefix = '') {
    const modelsAddedToFilesystem = [];

    function fileSystemFromModels(initialFilesystem = {}, ...models) {
        for (const model of models) {
            const modelIndexPath = [prefix, model.id.replace(/[A-Z0-9]+$/, '_index.json')].filter(i => !!i).join('/');
            const searchIndexRawPath = [prefix, model.id.replace(/[A-Z0-9]+$/, '_search_index_raw.json')].filter(i => !!i).join('/');

            const modelIndex = initialFilesystem[modelIndexPath] || {};
            initialFilesystem[[prefix, model.id + '.json'].filter(i => !!i).join('/')] = model.toData();
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
            const compiledIndex = lunr(function () {
                this.ref('id');

                for (const field of fields) {
                    this.field(field);
                }

                Object.values(index).forEach(function (doc) {
                    this.add(doc);
                }, this);
            });

            resolvedFiles[name.replace('_raw', '')] = JSON.parse(JSON.stringify(compiledIndex));
        }
    }

    return sinon.stub().callsFake(async (url, opts) => {
        if (opts.method === 'PUT') {
            resolvedFiles[url.pathname ?? url] = JSON.parse(opts.body);
            return {ok: true, status: 200, json: async () => ({})};
        }

        for (const [path, value] of Object.entries(errors)) {
            if ((url.pathname ?? url).endsWith(path)) {
                if (value) return value;
                return {
                    ok: false,
                    status: 404,
                    json: async () => {
                        throw new Error();
                    },
                };
            }
        }

        for (const [filename, value] of Object.entries(resolvedFiles)) {
            if ((url.pathname ?? url).endsWith(filename)) {
                return {ok: true, status: 200, json: async () => value};
            }
        }

        return {
            ok: false, status: 404, json: async () => {
                throw new Error();
            },
        };
    });
}

export default stubFetch;
