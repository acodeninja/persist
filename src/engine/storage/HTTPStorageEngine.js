import StorageEngine, {
    MisconfiguredStorageEngineError, ModelNotFoundStorageEngineError, StorageEngineError,
} from './StorageEngine.js';

export default class HTTPStorageEngine extends StorageEngine {
    /**
     * @param {Object} configuration - Configuration object containing fetch options and other settings.
     * @param {string} [configuration.baseURL] - Hostname and protocol of the HTTP service to use (ie: https://example.com).
     * @param {string?} [configuration.prefix] - The prefix on the host to perform operations against.
     * @param {Object?} [configuration.fetchOptions] - Fetch overrides to attach to all requests sent to the HTTP service.
     * @param {fetch} [configuration.fetch] - The http client that implements fetch.
     * @param {Array<Model.constructor>} models
     */
    constructor(configuration, models) {
        super(configuration, models);
        if (!this.configuration?.baseURL || !this.configuration?.fetch)
            throw new MisconfiguredStorageEngineError('both baseURL and fetch must be provided', this);

        this.configuration.fetchOptions = {
            ...(configuration.fetchOptions ?? {}),
            headers: {
                ...(configuration.fetchOptions?.headers ?? {}),
                Accept: 'application/json',
            },
        };
    }

    /**
     * Get a model
     * @param {string} id
     * @throws ModelNotFoundStorageEngineError
     * @return Promise<Model>
     */
    getModel(id) {
        return this.#processFetch(this.#generateURL([id]), this.#getReadOptions())
            .catch(error => {
                if (error.response.status === 404) {
                    throw new ModelNotFoundStorageEngineError(id);
                }
                throw error;
            });
    }

    /**
     * Update a model
     * @param {object} model
     * @throws HTTPRequestFailedError
     * @return Promise<void>
     */
    putModel(model) {
        return this.#processFetch(this.#generateURL([model.id]), {
            ...this.#getWriteOptions(),
            body: JSON.stringify(model),
        });
    }

    /**
     * Delete a model
     * @param {string} id
     * @throws HTTPRequestFailedError
     * @return Promise<void>
     */
    deleteModel(id) {
        return this.#processFetch(this.#generateURL([id]), {
            ...this.#getReadOptions(),
            method: 'DELETE',
        }).catch(error => {
            if (error.response.status === 404) {
                throw new ModelNotFoundStorageEngineError(id);
            }
            throw error;
        });
    }

    /**
     * Get a model's index data
     * @param {Model.constructor} modelConstructor
     * @return Promise<void>
     */
    getIndex(modelConstructor) {
        return this.#processFetch(
            this.#generateURL([modelConstructor.name]),
            this.#getReadOptions(),
            {},
        );
    }

    /**
     * Put a model's index data
     * @param {Model.constructor} modelConstructor
     * @param {object} index
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<void>
     */
    putIndex(modelConstructor, index) {
        return this.#processFetch(this.#generateURL([modelConstructor.name]), {
            ...this.#getWriteOptions(),
            body: JSON.stringify(index),
        });
    }

    /**
     * Get a model's raw search index data
     * @param {Model.constructor} modelConstructor
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<object>
     */
    getSearchIndex(modelConstructor) {
        return this.#processFetch(
            this.#generateURL([modelConstructor.name, 'search']),
            this.#getReadOptions(),
            {},
        );
    }

    /**
     * Put a model's raw and compiled search index data
     * @param {Model.constructor} modelConstructor
     * @param {Record<string, object>} index
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<void>
     */
    putSearchIndex(modelConstructor, index) {
        return this.#processFetch(this.#generateURL([modelConstructor.name, 'search']), {
            ...this.#getWriteOptions(),
            body: JSON.stringify(index),
        });
    }

    /**
     * Returns the fetch options for reading operations.
     *
     * @returns {Object} The fetch options for reading.
     */
    #getReadOptions() {
        return this.configuration.fetchOptions;
    }

    /**
     * Returns the fetch options for writing (PUT) operations.
     * Sets the method to PUT and adds a Content-Type header of 'application/json'.
     *
     * @returns {Object} The fetch options for writing.
     */
    #getWriteOptions() {
        return {
            ...this.#getReadOptions(),
            headers: {
                ...this.#getReadOptions().headers,
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
     * @throws {HTTPRequestFailedError} Thrown if the fetch request fails.
     */
    #processFetch(url, options, defaultValue = undefined) {
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
     * Creates a URL object based on the input path
     * @param {Array<string>} input
     * @return {module:url.URL}
     */
    #generateURL(input) {
        return new URL(
            [this.configuration.baseURL, this.configuration.prefix]
                .concat(input)
                .filter(Boolean)
                .join('/'),
        );
    }
}

/**
 * Represents an error specific to HTTP engine operations.
 * @class HTTPStorageEngineError
 * @extends StorageEngineError
 */
export class HTTPStorageEngineError extends StorageEngineError {}

/**
 * Error indicating a failed HTTP request.
 * @class HTTPRequestFailedError
 * @extends HTTPStorageEngineError
 *
 * @param {string} url - The URL of the failed request.
 * @param {Object} options - The options used in the fetch request.
 * @param {Response} response - The HTTP response object.
 */
export class HTTPRequestFailedError extends HTTPStorageEngineError {
    constructor(url, options, response) {
        const method = options.method?.toLowerCase() || 'get';
        super(`Failed to ${method} ${url}`);
        this.response = response;
        this.url = url;
        this.options = options;
    }
}
