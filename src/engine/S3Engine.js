import {GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3';

import Engine from './Engine.js';

export default class S3Engine extends Engine {
    static async getById(id) {
        const objectPath = [this._configuration.prefix, `${id}.json`].join('/');

        try {
            const data = await this._configuration.client.send(new GetObjectCommand({
                Bucket: this._configuration.bucket,
                Key: objectPath,
            }));
            return JSON.parse(await data.Body.transformToString());
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
        const Key = [this._configuration.prefix, `${model.id}.json`].join('/');

        await this._configuration.client.send(new PutObjectCommand({
            Key,
            Body: JSON.stringify(model.toData()),
            Bucket: this._configuration.bucket,
            ContentType: 'application/json',
        }));
    }

    static async getIndex(location) {
        try {
            const data = await this._configuration.client.send(new GetObjectCommand({
                Key: [this._configuration.prefix].concat([location]).concat(['_index.json']).filter(e => !!e).join('/'),
                Bucket: this._configuration.bucket,
            }));

            return JSON.parse(await data.Body.transformToString());
        } catch (_error) {
            return {};
        }
    }

    static async putIndex(index) {
        const processIndex = async (location, models) => {
            const modelIndex = Object.fromEntries(models.map(m => [m.id, m.toIndexData()]));
            const Key = [this._configuration.prefix].concat([location]).concat(['_index.json']).filter(e => !!e).join('/');

            const currentIndex = await this.getIndex(location);

            await this._configuration.client.send(new PutObjectCommand({
                Key,
                Bucket: this._configuration.bucket,
                ContentType: 'application/json',
                Body: JSON.stringify({
                    ...currentIndex,
                    ...modelIndex,
                }),
            }));
        };

        for (const [location, models] of Object.entries(index)) {
            await processIndex(location, models);
        }

        await processIndex(null, Object.values(index).flat());
    }
}
