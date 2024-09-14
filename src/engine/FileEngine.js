import Engine, {EngineError, MissConfiguredError} from './Engine.js';
import {dirname, join} from 'node:path';
import fs from 'node:fs/promises';

class FileEngineError extends EngineError {}

class FailedWriteFileEngineError extends FileEngineError {}

/**
 * @class FileEngine
 * @extends Engine
 */
export default class FileEngine extends Engine {
    static configure(configuration) {
        if (!configuration.filesystem) {
            configuration.filesystem = fs;
        }
        return super.configure(configuration);
    }

    static checkConfiguration() {
        if (
            !this._configuration?.path ||
            !this._configuration?.filesystem
        ) throw new MissConfiguredError(this._configuration);
    }

    static async getById(id) {
        const filePath = join(this._configuration.path, `${id}.json`);

        return JSON.parse(await this._configuration.filesystem.readFile(filePath).then(f => f.toString()));
    }

    static async getIndex(model) {
        return JSON.parse((await this._configuration.filesystem.readFile(join(this._configuration.path, model.name, '_index.json')).catch(() => '{}')).toString());
    }

    static async putModel(model) {
        const filePath = join(this._configuration.path, `${model.id}.json`);

        try {
            await this._configuration.filesystem.mkdir(dirname(filePath), {recursive: true});
            await this._configuration.filesystem.writeFile(filePath, JSON.stringify(model.toData()));
        } catch (error) {
            throw new FailedWriteFileEngineError(`Failed to put file://${filePath}`, error);
        }
    }

    static async putIndex(index) {
        const processIndex = async (location, models) => {
            const modelIndex = Object.fromEntries(models.map(m => [m.id, m.toIndexData()]));
            const filePath = join(this._configuration.path, location, '_index.json');
            const currentIndex = JSON.parse((await this._configuration.filesystem.readFile(filePath).catch(() => '{}')).toString());

            try {
                await this._configuration.filesystem.writeFile(filePath, JSON.stringify({
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

    static async getSearchIndexCompiled(model) {
        return await this._configuration.filesystem.readFile(join(this._configuration.path, model.name, '_search_index.json'))
            .then(b => b.toString())
            .then(JSON.parse);
    }

    static async getSearchIndexRaw(model) {
        return await this._configuration.filesystem.readFile(join(this._configuration.path, model.name, '_search_index_raw.json'))
            .then(b => b.toString())
            .then(JSON.parse)
            .catch(() => ({}));
    }

    static async putSearchIndexCompiled(model, compiledIndex) {
        const filePath = join(this._configuration.path, model.name, '_search_index.json');

        try {
            await this._configuration.filesystem.writeFile(filePath, JSON.stringify(compiledIndex));
        } catch (error) {
            throw new FailedWriteFileEngineError(`Failed to put file://${filePath}`, error);
        }
    }

    static async putSearchIndexRaw(model, rawIndex) {
        const filePath = join(this._configuration.path, model.name, '_search_index_raw.json');
        try {
            await this._configuration.filesystem.writeFile(filePath, JSON.stringify(rawIndex));
        } catch (error) {
            throw new FailedWriteFileEngineError(`Failed to put file://${filePath}`, error);
        }
    }
}
