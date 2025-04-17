import {
    DeleteObjectCommand,
    GetObjectCommand,
    NoSuchKey,
    PutObjectCommand,
} from '@aws-sdk/client-s3';
import StorageEngine, {
    MisconfiguredStorageEngineError,
    ModelNotFoundStorageEngineError,
} from './StorageEngine.js';

class S3StorageEngine extends StorageEngine {
    /**
     * @param {Object} configuration - Configuration object containing fetch options and other settings.
     * @param {string} [configuration.bucket] - Hostname and protocol of the HTTP service to use (ie: https://example.com).
     * @param {string?} [configuration.prefix] - The prefix on the host to perform operations against.
     * @param {S3Client} [configuration.client] - The http client that implements fetch.
     */
    constructor(configuration) {
        super(configuration);
        if (!configuration?.bucket || !configuration?.client)
            throw new MisconfiguredStorageEngineError('both bucket and client must be provided', this);
    }

    /**
     * Retrieves an object from S3 by its id
     * @param {string} id
     * @returns {Promise<Object>}
     * @throws {ModelNotFoundStorageEngineError|Error} Thrown if there is an issue with the S3 client request.
     */
    async getModel(id) {
        const objectPath = this.#generatePath([`${id}.json`]);

        try {
            const data = await this.configuration.client.send(new GetObjectCommand({
                Bucket: this.configuration.bucket,
                Key: objectPath,
            }));

            return JSON.parse(await data.Body.transformToString());
        } catch (error) {
            if (error instanceof NoSuchKey) {
                throw new ModelNotFoundStorageEngineError(id);
            }
            throw error;
        }
    }

    /**
     * Upload an object to S3
     * @param {object} model - The model object to upload.
     * @returns {Promise<void>}
     */
    async putModel(model) {
        const Key = this.#generatePath([`${model.id}.json`]);

        await this.configuration.client.send(new PutObjectCommand({
            Key,
            Body: JSON.stringify(model),
            Bucket: this.configuration.bucket,
            ContentType: 'application/json',
        }));
    }

    /**
     * Delete a model by its id
     * @param {string} id
     * @throws {ModelNotFoundStorageEngineError|Error}
     * @return Promise<void>
     */
    async deleteModel(id) {
        const Key = this.#generatePath([`${id}.json`]);
        try {
            await this.configuration.client.send(new DeleteObjectCommand({
                Bucket: this.configuration.bucket,
                Key,
            }));
        } catch (error) {
            if (error instanceof NoSuchKey) {
                throw new ModelNotFoundStorageEngineError(id);
            }
            throw error;
        }
    }

    /**
     * Get a model's index data
     * @param {Model.constructor} constructor
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<object>
     */
    async getIndex(constructor) {
        const Key = this.#generatePath([constructor?.toString(), '_index.json']);
        try {
            const data = await this.configuration.client.send(new GetObjectCommand({
                Bucket: this.configuration.bucket,
                Key,
            }));

            return JSON.parse(await data.Body.transformToString());
        } catch (_error) {
            return {};
        }
    }

    /**
     * Put a model's index data
     * @param {Model.constructor} constructor
     * @param {object} index
     * @throws MethodNotImplementedStorageEngineError
     * @return Promise<void>
     */
    async putIndex(constructor, index) {
        const Key = this.#generatePath([constructor.toString(), '_index.json']);
        await this.configuration.client.send(new PutObjectCommand({
            Key,
            Bucket: this.configuration.bucket,
            Body: JSON.stringify(index),
            ContentType: 'application/json',
        }));
    }

    /**
     * Get a model's raw search index data
     * @param {Model.constructor} constructor
     * @return Promise<Record<string, object>>
     */
    async getSearchIndex(constructor) {
        const Key = this.#generatePath([constructor.toString(), '_search_index.json']);

        try {
            const data = await this.configuration.client.send(new GetObjectCommand({
                Bucket: this.configuration.bucket,
                Key,
            }));

            return JSON.parse(await data.Body.transformToString());
        } catch (_error) {
            return {};
        }
    }

    /**
     * Put a model's search index data
     * @param {Model.constructor} constructor
     * @param {Record<string, object>} index
     * @return Promise<void>
     */
    async putSearchIndex(constructor, index) {
        const Key = this.#generatePath([constructor.toString(), '_search_index.json']);

        await this.configuration.client.send(new PutObjectCommand({
            Key,
            Bucket: this.configuration.bucket,
            Body: JSON.stringify(index),
            ContentType: 'application/json',
        }));
    }

    /**
     * Generate an S3 prefix path
     * @param {Array<string>} path
     * @return {string}
     */
    #generatePath(path) {
        return [this.configuration.prefix].concat(path).filter(Boolean).join('/');
    }
}

export default S3StorageEngine;
