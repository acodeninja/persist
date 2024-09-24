import Engine, { EngineError, MissConfiguredError } from './Engine.js';
import { dirname, join } from 'node:path';
import fs from 'node:fs/promises';

/**
 * Custom error class for FileEngine-related errors.
 * Extends the base `EngineError` class.
 */
class FileEngineError extends EngineError {}

/**
 * Error thrown when writing to a file fails in `FileEngine`.
 * Extends the `FileEngineError` class.
 */
class FailedWriteFileEngineError extends FileEngineError {}

/**
 * `FileEngine` class extends the base `Engine` class to implement
 * file system-based storage and retrieval of model data.
 *
 * @class FileEngine
 * @extends Engine
 */
class FileEngine extends Engine {
    /**
     * Configures the FileEngine with a given configuration object.
     * Adds default `filesystem` configuration if not provided.
     *
     * @param {Object} configuration - Configuration settings for FileEngine.
     * @param {Object} [configuration.filesystem] - Custom filesystem module (default: Node.js fs/promises).
     * @param {Object} [configuration.path] - The absolute path on the filesystem to write models to.
     * @returns {FileEngine} A configured instance of FileEngine.
     */
    static configure(configuration) {
        if (!configuration.filesystem) {
            configuration.filesystem = fs;
        }
        return super.configure(configuration);
    }

    /**
     * Checks if the FileEngine has been configured correctly.
     * Ensures that `path` and `filesystem` settings are present.
     *
     * @throws {MissConfiguredError} Throws if required configuration is missing.
     */
    static checkConfiguration() {
        if (!this.configuration?.path || !this.configuration?.filesystem) {
            throw new MissConfiguredError(this.configuration);
        }
    }

    /**
     * Retrieves a model by its ID from the file system.
     *
     * @param {string} id - The ID of the model to retrieve.
     * @returns {Promise<Object>} The parsed model data.
     * @throws {Error} Throws if the file cannot be read or parsed.
     */
    static getById(id) {
        return this.configuration.filesystem
            .readFile(join(this.configuration.path, `${id}.json`))
            .then((b) => b.toString())
            .then(JSON.parse);
    }

    /**
     * Retrieves the index for a given model from the file system.
     *
     * @param {Model.constructor?} model - The model for which the index is retrieved.
     * @returns {Promise<Object>} The parsed index data.
     * @throws {Error} Throws if the file cannot be read.
     */
    static getIndex(model) {
        return this.configuration.filesystem
            .readFile(join(this.configuration.path, model.toString(), '_index.json'))
            .then((b) => b.toString())
            .catch(() => '{}')
            .then(JSON.parse);
    }

    /**
     * Saves a model to the file system.
     *
     * @param {Model} model - The model to save.
     * @throws {FailedWriteFileEngineError} Throws if the model cannot be written to the file system.
     */
    static async putModel(model) {
        const filePath = join(this.configuration.path, `${model.id}.json`);
        try {
            await this.configuration.filesystem.mkdir(dirname(filePath), { recursive: true });
            await this.configuration.filesystem.writeFile(filePath, JSON.stringify(model.toData()));
        } catch (error) {
            throw new FailedWriteFileEngineError(`Failed to put file://${filePath}`, error);
        }
    }

    /**
     * Saves the index for multiple models to the file system.
     *
     * @param {Object} index - An object where keys are locations and values are arrays of models.
     * @throws {FailedWriteFileEngineError} Throws if the index cannot be written to the file system.
     */
    static async putIndex(index) {
        const processIndex = async (location, models) => {
            const modelIndex = Object.fromEntries(models.map((m) => [m.id, m.toIndexData()]));
            const filePath = join(this.configuration.path, location, '_index.json');
            const currentIndex = JSON.parse((await this.configuration.filesystem.readFile(filePath).catch(() => '{}')).toString());

            try {
                await this.configuration.filesystem.writeFile(filePath, JSON.stringify({
                    ...currentIndex,
                    ...modelIndex,
                }));
            } catch (error) {
                throw new FailedWriteFileEngineError(`Failed to put file://${filePath}`, error);
            }
        };

        for (const [location, models] of Object.entries(index)) {
            await processIndex(location, models);
        }

        await processIndex('', Object.values(index).flat());
    }

    /**
     * Retrieves the compiled search index for a model from the file system.
     *
     * @param {Model.constructor} model - The model for which the search index is retrieved.
     * @returns {Promise<Object>} The parsed compiled search index.
     * @throws {Error} Throws if the file cannot be read.
     */
    static getSearchIndexCompiled(model) {
        return this.configuration.filesystem
            .readFile(join(this.configuration.path, model.toString(), '_search_index.json'))
            .then((b) => b.toString())
            .then(JSON.parse);
    }

    /**
     * Retrieves the raw search index for a model from the file system.
     *
     * @param {Model.constructor} model - The model for which the raw search index is retrieved.
     * @returns {Promise<Object>} The parsed raw search index.
     * @throws {Error} Throws if the file cannot be read.
     */
    static getSearchIndexRaw(model) {
        return this.configuration.filesystem
            .readFile(join(this.configuration.path, model.toString(), '_search_index_raw.json'))
            .then((b) => b.toString())
            .then(JSON.parse)
            .catch(() => ({}));
    }

    /**
     * Saves the compiled search index for a model to the file system.
     *
     * @param {Model.constructor} model - The model for which the compiled search index is saved.
     * @param {Object} compiledIndex - The compiled search index to save.
     * @throws {FailedWriteFileEngineError} Throws if the compiled index cannot be written to the file system.
     */
    static async putSearchIndexCompiled(model, compiledIndex) {
        const filePath = join(this.configuration.path, model.toString(), '_search_index.json');
        try {
            await this.configuration.filesystem.writeFile(filePath, JSON.stringify(compiledIndex));
        } catch (error) {
            throw new FailedWriteFileEngineError(`Failed to put file://${filePath}`, error);
        }
    }

    /**
     * Saves the raw search index for a model to the file system.
     *
     * @param {Model.constructor} model - The model for which the raw search index is saved.
     * @param {Object} rawIndex - The raw search index to save.
     * @throws {FailedWriteFileEngineError} Throws if the raw index cannot be written to the file system.
     */
    static async putSearchIndexRaw(model, rawIndex) {
        const filePath = join(this.configuration.path, model.toString(), '_search_index_raw.json');
        try {
            await this.configuration.filesystem.writeFile(filePath, JSON.stringify(rawIndex));
        } catch (error) {
            throw new FailedWriteFileEngineError(`Failed to put file://${filePath}`, error);
        }
    }
}

export default FileEngine;
