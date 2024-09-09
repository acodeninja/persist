import Engine, {EngineError, MissConfiguredError} from './Engine.js';

export class HTTPEngineError extends EngineError {
}

export class HTTPRequestFailedError extends HTTPEngineError {
    constructor(url, options, response) {
        const method = options.method?.toLowerCase() || 'get';
        super(`Failed to ${method} ${url}`);
        this.response = response;
        this.url = url;
        this.options = options;
    }
}

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

    static checkConfiguration() {
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

    static async _processFetch(url, options, defaultValue = undefined) {
        return this._configuration.fetch(url, options)
            .then(response => {
                if (!response.ok) {
                    if (defaultValue !== undefined) {
                        return {json: () => Promise.resolve(defaultValue)};
                    }

                    throw new HTTPRequestFailedError(url, options, response);
                }

                return response;
            })
            .then(r => r.json());
    }

    static async getById(id) {
        this.checkConfiguration();

        const url = new URL([
            this._configuration.host,
            this._configuration.prefix,
            `${id}.json`,
        ].filter(e => !!e).join('/'));

        return await this._processFetch(url, this._getReadOptions());
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

        return await this._processFetch(url, {
            ...this._getWriteOptions(),
            body: JSON.stringify(model.toData()),
        });
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

            return await this._processFetch(url, {
                ...this._getWriteOptions(),
                body: JSON.stringify({
                    ...await this.getIndex(location),
                    ...modelIndex,
                }),
            });
        };

        for (const [location, models] of Object.entries(index)) {
            await processIndex(location, models);
        }

        await processIndex(null, Object.values(index).flat());
    }

    static async getIndex(location) {
        const url = new URL([this._configuration.host, this._configuration.prefix, location, '_index.json'].filter(e => !!e).join('/'));

        return await this._processFetch(url, this._getReadOptions(), {});
    }

    static async getSearchIndexCompiled(model) {
        const url = new URL([
            this._configuration.host,
            this._configuration.prefix,
            model.toString(),
            '_search_index.json',
        ].join('/'));

        return await this._processFetch(url, this._getReadOptions());
    }

    static async getSearchIndexRaw(model) {
        const url = new URL([
            this._configuration.host,
            this._configuration.prefix,
            model.toString(),
            '_search_index_raw.json',
        ].join('/'));

        return await this._processFetch(url, this._getReadOptions()).catch(() => ({}));
    }

    static async putSearchIndexCompiled(model, compiledIndex) {
        const url = new URL([
            this._configuration.host,
            this._configuration.prefix,
            model.name,
            '_search_index.json',
        ].filter(e => !!e).join('/'));

        return this._processFetch(url, {
            ...this._getWriteOptions(),
            body: JSON.stringify(compiledIndex),
        });
    }

    static async putSearchIndexRaw(model, rawIndex) {
        const url = new URL([
            this._configuration.host,
            this._configuration.prefix,
            model.name,
            '_search_index_raw.json',
        ].filter(e => !!e).join('/'));

        return await this._processFetch(url, {
            ...this._getWriteOptions(),
            body: JSON.stringify(rawIndex),
        });
    }
}
