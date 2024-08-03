import Engine, {MissConfiguredError} from './Engine.js';

export default class HTTPEngine extends Engine {
    static configure(configuration = {}) {
        configuration.fetchOptions = {
            ...(configuration.fetchOptions ?? {}),
            headers: {
                ...(configuration.fetchOptions?.headers ?? {}),
                Accept: 'application/json',
            },
        };

        return super.configure(configuration);
    }

    static _checkConfiguration() {
        if (
            !this._configuration?.host
        ) throw new MissConfiguredError(this._configuration);
    }

    static _getReadOptions() {
        return this._configuration.fetchOptions;
    }

    static _getWriteOptions() {
        return {
            ...this._getReadOptions(),
            headers: {
                ...this._getReadOptions().headers,
                'Content-Type': 'application/json',
            },
            method: 'PUT',
        };
    }

    static async getById(id) {
        this._checkConfiguration();
        const url = new URL([
            this._configuration.host,
            this._configuration.prefix,
            `${id}.json`,
        ].filter(e => !!e).join('/'));

        try {
            return await this._configuration.fetch(url, this._getReadOptions()).then(r => r.json());
        } catch (_error) {
            return undefined;
        }
    }

    static async findByValue(model, parameters) {
        const index = await this.getIndex(model.name);
        return Object.values(index)
            .filter((model) =>
                Object.entries(parameters)
                    .some(([name, value]) => model[name] === value),
            );
    }

    static async putModel(model) {
        const url = new URL([
            this._configuration.host,
            this._configuration.prefix,
            `${model.id}.json`,
        ].filter(e => !!e).join('/'));

        try {
            return await this._configuration.fetch(url, {
                ...this._getWriteOptions(),
                body: JSON.stringify(model.toData()),
            }).then(r => r.json());
        } catch (_error) {
            return undefined;
        }
    }

    static async putIndex(index) {
        const processIndex = async (location, models) => {
            const modelIndex = Object.fromEntries(models.map(m => [m.id, m.toIndexData()]));
            const url = new URL([
                this._configuration.host,
                this._configuration.prefix,
                location,
                '_index.json',
            ].filter(e => !!e).join('/'));

            const currentIndex = await this.getIndex(location);

            try {
                return await this._configuration.fetch(url, {
                    ...this._getWriteOptions(),
                    body: JSON.stringify({
                        ...currentIndex,
                        ...modelIndex,
                    }),
                }).then(r => r.json());
            } catch (_error) {
                return undefined;
            }
        };

        for (const [location, models] of Object.entries(index)) {
            await processIndex(location, models);
        }

        await processIndex(null, Object.values(index).flat());
    }

    static async getIndex(location) {
        const url = new URL(this._configuration.host + '/' + [this._configuration.prefix, location, '_index.json'].filter(e => !!e).join('/'));

        try {
            return await this._configuration.fetch(url, this._getReadOptions()).then(r => r.json());
        } catch (_error) {
            return {};
        }
    }

    static async getSearchIndexCompiled(model) {
        const url = new URL(this._configuration.host + '/' + [this._configuration.prefix].concat([model.name]).concat(['_search_index.json']).join('/'));

        try {
            return await this._configuration.fetch(url, this._getReadOptions()).then(r => r.json());
        } catch (_error) {
            return {};
        }
    }

    static async getSearchIndexRaw(model) {
        const url = new URL(this._configuration.host + '/' + [this._configuration.prefix].concat([model.name]).concat(['_search_index_raw.json']).join('/'));

        try {
            return await this._configuration.fetch(url, this._getReadOptions()).then(r => r.json());
        } catch (_error) {
            return {};
        }
    }

    static async putSearchIndexCompiled(model, compiledIndex) {
        const url = new URL([
            this._configuration.host,
            this._configuration.prefix,
            model.name,
            '_search_index.json',
        ].filter(e => !!e).join('/'));

        try {
            return await this._configuration.fetch(url, {
                ...this._getWriteOptions(),
                body: JSON.stringify(compiledIndex),
            }).then(r => r.json());
        } catch (_error) {
            return undefined;
        }
    }

    static async putSearchIndexRaw(model, rawIndex) {
        const url = new URL([
            this._configuration.host,
            this._configuration.prefix,
            model.name,
            '_search_index_raw.json',
        ].filter(e => !!e).join('/'));

        try {
            return await this._configuration.fetch(url, {
                ...this._getWriteOptions(),
                body: JSON.stringify(rawIndex),
            }).then(r => r.json());
        } catch (_error) {
            return undefined;
        }
    }
}
