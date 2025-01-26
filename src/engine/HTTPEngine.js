import Engine, {EngineError, MissConfiguredError} from './Engine.js';

/**
 * Represents an error specific to HTTP engine operations.
 * @class HTTPEngineError
 * @extends EngineError
 */
export class HTTPEngineError extends EngineError {}

/**
 * Error indicating a failed HTTP request.
 * @class HTTPRequestFailedError
 * @extends HTTPEngineError
 *
 * @param {string} url - The URL of the failed request.
 * @param {Object} options - The options used in the fetch request.
 * @param {Response} response - The HTTP response object.
 */
export class HTTPRequestFailedError extends HTTPEngineError {
    constructor(url, options, response) {
        const method = options.method?.toLowerCase() || 'get';
        super(`Failed to ${method} ${url}`);
        this.response = response;
        this.url = url;
        this.options = options;
    }
}

/**
 * HTTPEngine is an extension of the Engine class that provides methods for interacting with HTTP-based APIs.
 * It uses the Fetch API for sending and receiving data.
 *
 * @class HTTPEngine
 * @extends Engine
 */
class HTTPEngine extends Engine {

    /**
     * Configures the HTTP engine with additional fetch options.
     * Sets the Accept header to 'application/json' by default.
     *
     * @param {Object} configuration - Configuration object containing fetch options and other settings.
     * @param {string} [configuration.host] - Hostname and protocol of the HTTP service to use (ie: https://example.com).
     * @param {string?} [configuration.prefix] - The prefix on the host to perform operations against.
     * @param {Object} [configuration.fetchOptions] - Fetch overrides to attach to all requests sent to the HTTP service.
     * @returns {Object} The configured settings for the HTTP engine.
     */
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

    /**
     * Validates the engine's configuration, ensuring that the host is defined.
     *
     * @throws {MissConfiguredError} Thrown if the configuration is missing a host.
     */
    static checkConfiguration() {
        if (!this.configuration?.host) throw new MissConfiguredError(this.configuration);
    }

    /**
     * Returns the fetch options for reading operations.
     *
     * @returns {Object} The fetch options for reading.
     */
    static _getReadOptions() {
        return this.configuration.fetchOptions;
    }

    /**
     * Returns the fetch options for writing (PUT) operations.
     * Sets the method to PUT and adds a Content-Type header of 'application/json'.
     *
     * @returns {Object} The fetch options for writing.
     */
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

    /**
     * Processes a fetch request with error handling. Throws an error if the response is not successful.
     *
     * @param {string|URL} url - The URL to fetch.
     * @param {Object} options - The fetch options.
     * @param {*} [defaultValue] - A default value to return if the fetch fails.
     * @returns {Promise<Object>} The parsed JSON response.
     *
     * @throws {HTTPRequestFailedError} Thrown if the fetch request fails.
     */
    static _processFetch(url, options, defaultValue = undefined) {
        return this.configuration.fetch(url, options)
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

    /**
     * Retrieves an object by its ID from the server.
     *
     * @param {string} id - The ID of the object to retrieve.
     * @returns {Promise<Object>} The retrieved object in JSON format.
     *
     * @throws {HTTPRequestFailedError} Thrown if the fetch request fails.
     */
    static getById(id) {
        this.checkConfiguration();

        const url = new URL([
            this.configuration.host,
            this.configuration.prefix,
            `${id}.json`,
        ].filter(e => Boolean(e)).join('/'));

        return this._processFetch(url, this._getReadOptions());
    }

    /**
     * Deletes a model by its ID from an HTTP server.
     *
     * @param {string} id - The ID of the model to delete.
     * @returns {Promise<void>} Resolves when the model has been deleted.
     * @throws {Error} Throws if the file cannot be deleted.
     */
    static deleteById(id) {
        this.checkConfiguration();

        const url = new URL([
            this.configuration.host,
            this.configuration.prefix,
            `${id}.json`,
        ].filter(e => Boolean(e)).join('/'));

        return this._processFetch(url, {...this._getReadOptions(), method: 'DELETE'});
    }

    /**
     * Uploads (puts) a model object to the server.
     *
     * @param {Model} model - The model object to upload.
     * @returns {Promise<Object>} The response from the server.
     *
     * @throws {HTTPRequestFailedError} Thrown if the PUT request fails.
     */
    static putModel(model) {
        const url = new URL([
            this.configuration.host,
            this.configuration.prefix,
            `${model.id}.json`,
        ].filter(e => Boolean(e)).join('/'));

        return this._processFetch(url, {
            ...this._getWriteOptions(),
            body: JSON.stringify(model.toData()),
        });
    }

    /**
     * Uploads (puts) an index object to the server.
     *
     * @param {Object} index - The index data to upload, organized by location.
     * @returns {Promise<void>}
     *
     * @throws {HTTPRequestFailedError} Thrown if the PUT request fails.
     */
    static async putIndex(index) {
        const processIndex = async (location, models) => {
            const modelIndex = Object.fromEntries(models.map(m => [m.id, m.toIndexData()]));
            const url = new URL([
                this.configuration.host,
                this.configuration.prefix,
                location,
                '_index.json',
            ].filter(e => Boolean(e)).join('/'));

            return this._processFetch(url, {
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

    /**
     * Retrieves the index object from the server for the specified location.
     *
     * @param {Model.constructor?} model - The model in the host where the index is stored.
     * @returns {Promise<Object>} The index data in JSON format.
     */
    static getIndex(model) {
        const url = new URL([
            this.configuration.host,
            this.configuration.prefix,
            model?.toString(),
            '_index.json',
        ].filter(e => Boolean(e)).join('/'));

        return this._processFetch(url, this._getReadOptions(), {});
    }

    /**
     * Retrieves the compiled search index for a model from the server.
     *
     * @param {Model.constructor} model - The model whose compiled search index to retrieve.
     * @returns {Promise<Object>} The compiled search index in JSON format.
     */
    static getSearchIndexCompiled(model) {
        const url = new URL([
            this.configuration.host,
            this.configuration.prefix,
            model.toString(),
            '_search_index.json',
        ].join('/'));

        return this._processFetch(url, this._getReadOptions());
    }

    /**
     * Retrieves the raw (uncompiled) search index for a model from the server.
     *
     * @param {Model.constructor} model - The model whose raw search index to retrieve.
     * @returns {Promise<Object>} The raw search index in JSON format, or an empty object if not found.
     */
    static getSearchIndexRaw(model) {
        const url = new URL([
            this.configuration.host,
            this.configuration.prefix,
            model.toString(),
            '_search_index_raw.json',
        ].join('/'));

        return this._processFetch(url, this._getReadOptions()).catch(() => ({}));
    }

    /**
     * Uploads (puts) a compiled search index for a model to the server.
     *
     * @param {Model.constructor} model - The model whose compiled search index to upload.
     * @param {Object} compiledIndex - The compiled search index data.
     * @returns {Promise<Object>} The response from the server.
     *
     * @throws {HTTPRequestFailedError} Thrown if the PUT request fails.
     */
    static putSearchIndexCompiled(model, compiledIndex) {
        const url = new URL([
            this.configuration.host,
            this.configuration.prefix,
            model.toString(),
            '_search_index.json',
        ].filter(e => Boolean(e)).join('/'));

        return this._processFetch(url, {
            ...this._getWriteOptions(),
            body: JSON.stringify(compiledIndex),
        });
    }

    /**
     * Uploads (puts) a raw search index for a model to the server.
     *
     * @param {Model.constructor} model - The model whose raw search index to upload.
     * @param {Object} rawIndex - The raw search index data.
     * @returns {Promise<Object>} The response from the server.
     *
     * @throws {HTTPRequestFailedError} Thrown if the PUT request fails.
     */
    static putSearchIndexRaw(model, rawIndex) {
        const url = new URL([
            this.configuration.host,
            this.configuration.prefix,
            model.toString(),
            '_search_index_raw.json',
        ].filter(e => Boolean(e)).join('/'));

        return this._processFetch(url, {
            ...this._getWriteOptions(),
            body: JSON.stringify(rawIndex),
        });
    }
}

export default HTTPEngine;
