import Engine, {EngineError, MissConfiguredError} from './Engine.js';
import {GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3';

class S3EngineError extends EngineError {}

class FailedPutS3EngineError extends S3EngineError {}

export default class S3Engine extends Engine {
    static checkConfiguration() {
        if (
            !this.configuration?.bucket ||
            !this.configuration?.client
        ) throw new MissConfiguredError(this.configuration);
    }

    static async getById(id) {
        const objectPath = [this.configuration.prefix, `${id}.json`].join('/');

        const data = await this.configuration.client.send(new GetObjectCommand({
            Bucket: this.configuration.bucket,
            Key: objectPath,
        }));

        return JSON.parse(await data.Body.transformToString());
    }

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

    static async getIndex(location) {
        try {
            const data = await this.configuration.client.send(new GetObjectCommand({
                Key: [this.configuration.prefix, location, '_index.json'].filter(e => !!e).join('/'),
                Bucket: this.configuration.bucket,
            }));

            return JSON.parse(await data.Body.transformToString());
        } catch (_) {
            return {};
        }
    }

    static async putIndex(index) {
        const processIndex = async (location, models) => {
            const modelIndex = Object.fromEntries(models.map(m => [m.id, m.toIndexData()]));
            const Key = [this.configuration.prefix, location, '_index.json'].filter(e => !!e).join('/');

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

    static async getSearchIndexCompiled(model) {
        return await this.configuration.client.send(new GetObjectCommand({
            Key: [this.configuration.prefix, model.name, '_search_index.json'].join('/'),
            Bucket: this.configuration.bucket,
        })).then(data => data.Body.transformToString())
            .then(JSON.parse);
    }

    static async getSearchIndexRaw(model) {
        return await this.configuration.client.send(new GetObjectCommand({
            Key: [this.configuration.prefix, model.name, '_search_index_raw.json'].join('/'),
            Bucket: this.configuration.bucket,
        })).then(data => data.Body.transformToString())
            .then(JSON.parse)
            .catch(() => ({}));
    }

    static async putSearchIndexCompiled(model, compiledIndex) {
        const Key = [this.configuration.prefix, model.name, '_search_index.json'].join('/');

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

    static async putSearchIndexRaw(model, rawIndex) {
        const Key = [this.configuration.prefix, model.name, '_search_index_raw.json'].join('/');

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
