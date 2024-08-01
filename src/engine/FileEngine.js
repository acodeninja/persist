import {dirname, join} from 'node:path';
import Engine from './Engine.js';
import fs from 'node:fs/promises';

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

    static async getById(id) {
        const filePath = join(this._configuration.path, `${id}.json`);

        try {
            return JSON.parse(await this._configuration.filesystem.readFile(filePath).then(f => f.toString()));
        } catch (_) {
            return null;
        }
    }

    static async findByValue(model, parameters) {
        const index = JSON.parse((await this._configuration.filesystem.readFile(join(this._configuration.path, model.name, '_index.json')).catch(() => '{}')).toString());
        return Object.values(index)
            .filter((model) =>
                Object.entries(parameters)
                    .some(([name, value]) => model[name] === value),
            );
    }

    static async putModel(model) {
        const filePath = join(this._configuration.path, `${model.id}.json`);

        await this._configuration.filesystem.mkdir(dirname(filePath), {recursive: true});
        await this._configuration.filesystem.writeFile(filePath, JSON.stringify(model.toData()));
    }

    static async putIndex(index) {
        const processIndex = async (location, models) => {
            const modelIndex = Object.fromEntries(models.map(m => [m.id, m.toIndexData()]));
            const filePath = join(this._configuration.path, location, '_index.json');
            const currentIndex = JSON.parse((await this._configuration.filesystem.readFile(filePath).catch(() => '{}')).toString());

            await this._configuration.filesystem.writeFile(filePath, JSON.stringify({
                ...currentIndex,
                ...modelIndex,
            }));
        };

        for (const [location, models] of Object.entries(index)) {
            await processIndex(location, models);
        }

        await processIndex('', Object.values(index).flat());
    }
}
