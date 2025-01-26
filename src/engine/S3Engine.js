import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3';
import Engine, {EngineError, MissConfiguredError} from './Engine.js';

/**
 * Represents an error specific to the S3 engine operations.
 * @class S3EngineError
 * @extends EngineError
 */
class S3EngineError extends EngineError {}

/**
 * Error indicating a failure when putting an object to S3.
 * @class FailedPutS3EngineError
 * @extends S3EngineError
 */
class FailedPutS3EngineError extends S3EngineError {}

/**
 * S3Engine is an extension of the Engine class that provides methods for interacting with AWS S3.
 * It allows for storing, retrieving, and managing model data in an S3 bucket.
 *
 * @class S3Engine
 * @extends Engine
 */
class S3Engine extends Engine {
    /**
     * Configures the S3 engine with additional options.
     *
     * @param {Object} configuration - Configuration object.
     * @param {S3Client} [configuration.client] - An S3 client used to process operations.
     * @param {string} [configuration.bucket] - The S3 bucket to perform operations against.
     * @param {string?} [configuration.prefix] - The optional prefix in the bucket to perform operations against.
     * @returns {Object} The configured settings for the HTTP engine.
     */
    static configure(configuration = {}) {
        return super.configure(configuration);
    }

    /**
     * Validates the S3 engine configuration to ensure necessary parameters (bucket and client) are present.
     * Throws an error if the configuration is invalid.
     *
     * @throws {MissConfiguredError} Thrown when the configuration is missing required parameters.
     */
    static checkConfiguration() {
        if (
            !this.configuration?.bucket ||
            !this.configuration?.client
        ) throw new MissConfiguredError(this.configuration);
    }

    /**
     * Retrieves an object from S3 by its ID.
     *
     * @param {string} id - The ID of the object to retrieve.
     * @returns {Promise<Object>} The parsed JSON object retrieved from S3.
     *
     * @throws {Error} Thrown if there is an issue with the S3 client request.
     */
    static async getById(id) {
        const objectPath = [this.configuration.prefix, `${id}.json`].join('/');

        const data = await this.configuration.client.send(new GetObjectCommand({
            Bucket: this.configuration.bucket,
            Key: objectPath,
        }));

        return JSON.parse(await data.Body.transformToString());
    }

    /**
     * Deletes a model by its ID from theS3 bucket.
     *
     * @param {string} id - The ID of the model to delete.
     * @returns {Promise<void>} Resolves when the model has been deleted.
     * @throws {Error} Throws if the model cannot be deleted.
     */
    static async deleteById(id) {
        const objectPath = [this.configuration.prefix, `${id}.json`].join('/');

        await this.configuration.client.send(new DeleteObjectCommand({
            Bucket: this.configuration.bucket,
            Key: objectPath,
        }));

        return undefined;
    }

    /**
     * Puts (uploads) a model object to S3.
     *
     * @param {Model} model - The model object to upload.
     * @returns {Promise<void>}
     *
     * @throws {FailedPutS3EngineError} Thrown if there is an error during the S3 PutObject operation.
     */
    static async putModel(model) {
        const Key = [this.configuration.prefix, `${model.id}.json`].join('/');

        try {
            await this.configuration.client.send(new PutObjectCommand({
                Key,
                Body: JSON.stringify(model.toData()),
                Bucket: this.configuration.bucket,
                ContentType: 'application/json',
            }));
        } catch (error) {
            throw new FailedPutS3EngineError(`Failed to put s3://${this.configuration.bucket}/${Key}`, error);
        }
    }

    /**
     * Retrieves the index object from S3 at the specified location.
     *
     * @param {Model.constructor?} model - The model in the bucket where the index is stored.
     * @returns {Promise<Object>} The parsed index object.
     */
    static async getIndex(model) {
        try {
            const data = await this.configuration.client.send(new GetObjectCommand({
                Key: [this.configuration.prefix, model?.toString(), '_index.json'].filter(e => Boolean(e)).join('/'),
                Bucket: this.configuration.bucket,
            }));

            return JSON.parse(await data.Body.transformToString());
        } catch (_error) {
            return {};
        }
    }

    /**
     * Puts (uploads) an index object to S3.
     *
     * @param {Object} index - The index data to upload, organized by location.
     * @returns {Promise<void>}
     *
     * @throws {FailedPutS3EngineError} Thrown if there is an error during the S3 PutObject operation.
     */
    static async putIndex(index) {
        const processIndex = async (location, models) => {
            const modelIndex = Object.fromEntries(models.map(m => [m.id, m.toIndexData()]));
            const Key = [this.configuration.prefix, location, '_index.json'].filter(e => Boolean(e)).join('/');

            const currentIndex = await this.getIndex(location);

            try {
                await this.configuration.client.send(new PutObjectCommand({
                    Key,
                    Bucket: this.configuration.bucket,
                    ContentType: 'application/json',
                    Body: JSON.stringify({
                        ...currentIndex,
                        ...modelIndex,
                    }),
                }));
            } catch (error) {
                throw new FailedPutS3EngineError(`Failed to put s3://${this.configuration.bucket}/${Key}`, error);
            }
        };

        for (const [location, models] of Object.entries(index)) {
            await processIndex(location, models);
        }

        await processIndex(null, Object.values(index).flat());
    }

    /**
     * Retrieves the compiled search index for a specific model from S3.
     *
     * @param {Model.constructor} model - The model whose search index to retrieve.
     * @returns {Promise<Object>} The compiled search index.
     */
    static getSearchIndexCompiled(model) {
        return this.configuration.client.send(new GetObjectCommand({
            Key: [this.configuration.prefix, model.toString(), '_search_index.json'].join('/'),
            Bucket: this.configuration.bucket,
        })).then(data => data.Body.transformToString())
            .then(JSON.parse);
    }

    /**
     * Retrieves the raw (uncompiled) search index for a specific model from S3.
     *
     * @param {Model.constructor} model - The model whose raw search index to retrieve.
     * @returns {Promise<Object>} The raw search index, or an empty object if not found.
     */
    static getSearchIndexRaw(model) {
        return this.configuration.client.send(new GetObjectCommand({
            Key: [this.configuration.prefix, model.toString(), '_search_index_raw.json'].join('/'),
            Bucket: this.configuration.bucket,
        })).then(data => data.Body.transformToString())
            .then(JSON.parse)
            .catch(() => ({}));
    }

    /**
     * Puts (uploads) a compiled search index for a specific model to S3.
     *
     * @param {Model.constructor} model - The model whose compiled search index to upload.
     * @param {Object} compiledIndex - The compiled search index data.
     * @returns {Promise<void>}
     *
     * @throws {FailedPutS3EngineError} Thrown if there is an error during the S3 PutObject operation.
     */
    static async putSearchIndexCompiled(model, compiledIndex) {
        const Key = [this.configuration.prefix, model.toString(), '_search_index.json'].join('/');

        try {
            await this.configuration.client.send(new PutObjectCommand({
                Key,
                Body: JSON.stringify(compiledIndex),
                Bucket: this.configuration.bucket,
                ContentType: 'application/json',
            }));
        } catch (error) {
            throw new FailedPutS3EngineError(`Failed to put s3://${this.configuration.bucket}/${Key}`, error);
        }
    }

    /**
     * Puts (uploads) a raw search index for a specific model to S3.
     *
     * @param {Model.constructor} model - The model whose raw search index to upload.
     * @param {Object} rawIndex - The raw search index data.
     * @returns {Promise<void>}
     *
     * @throws {FailedPutS3EngineError} Thrown if there is an error during the S3 PutObject operation.
     */
    static async putSearchIndexRaw(model, rawIndex) {
        const Key = [this.configuration.prefix, model.toString(), '_search_index_raw.json'].join('/');

        try {
            await this.configuration.client.send(new PutObjectCommand({
                Key,
                Body: JSON.stringify(rawIndex),
                Bucket: this.configuration.bucket,
                ContentType: 'application/json',
            }));
        } catch (error) {
            throw new FailedPutS3EngineError(`Failed to put s3://${this.configuration.bucket}/${Key}`, error);
        }
    }
}

export default S3Engine;
