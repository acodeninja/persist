import {describe, expect, test} from '@jest/globals';
import {EmptyModel} from '../fixtures/Model.js';
import HTTPStorageEngine from '@acodeninja/persist/storage/http';
import Persist from '@acodeninja/persist';
import {S3Client} from '@aws-sdk/client-s3';
import S3StorageEngine from '@acodeninja/persist/storage/s3';

describe('creating models', () => {
    describe('a basic model', () => {
        class Page extends Persist.Model {
            static title = Persist.Property.String.required;
            static subtitle = Persist.Property.String;
            static draft = Persist.Property.Boolean.required;
            static created = Persist.Property.Date.required;
            static readingTime = Persist.Property.Number;
        }

        test('creating a new instance', () => {
            const created = new Date();
            const page = new Page({
                title: 'Test Page',
                subtitle: 'A page to test the persist library.',
                draft: true,
                created,
                readingTime: 6,
            });

            expect(page).toBeInstanceOf(Page);
            expect(page.title).toBe('Test Page');
            expect(page.subtitle).toBe('A page to test the persist library.');
            expect(page.draft).toBe(true);
            expect(page.created).toBe(created);
            expect(page.readingTime).toBe(6);
        });

        describe('validating an instance', () => {
            test('passes validation when valid', () => {
                const created = new Date();
                const page = new Page({
                    title: 'Test Page',
                    subtitle: 'A page to test the persist library.',
                    draft: true,
                    created,
                    readingTime: 6,
                });

                expect(() => page.validate()).not.toThrow();
            });

            test('fails validation when invalid', () => {
                let error = null;
                const page = new Page({
                    title: 'Test Page',
                    subtitle: 'A page to test the persist library.',
                    draft: 'string',
                    created: 'new',
                    readingTime: 6,
                });

                try {
                    page.validate();
                } catch (e) {
                    error = e;
                } finally {
                    expect(error).toBeInstanceOf(Persist.Errors.ValidationError);
                    expect(error).toHaveProperty('message', 'Validation failed');
                    expect(error).toHaveProperty('errors', [{
                        instancePath: '/draft',
                        schemaPath: '#/properties/draft/type',
                        keyword: 'type',
                        params: {type: 'boolean'},
                        message: 'must be boolean',
                    }, {
                        instancePath: '/created',
                        schemaPath: '#/properties/created/format',
                        keyword: 'format',
                        params: {format: 'iso-date-time'},
                        message: 'must match format "iso-date-time"',
                    }]);
                    expect(error).toHaveProperty('data', page.toData());
                }
            });
        });
    });
});

describe('working with data storage engines', () => {
    describe('registering and retrieving connections', () => {
        describe('with an S3 bucket', () => {
            const s3StorageEngine = new S3StorageEngine({
                bucket: 's3-bucket',
                prefix: 'data',
                client: new S3Client(),
            });

            const connectionName = 's3-bucket';

            const connection = Persist.registerConnection(
                connectionName,
                s3StorageEngine,
                [EmptyModel],
            );

            test('allows using the connection', () => {
                expect(connection).toBeInstanceOf(Persist.Connection);
            });

            test('allows creating a transaction', () => {
                expect(connection.transaction()).toBeInstanceOf(Persist.Connection);
            });

            test('allows retrieving the connection later', () => {
                expect(Persist.getConnection(connectionName)).toBeInstanceOf(Persist.Connection);
            });
        });

        describe('with a Restful HTTP API', () => {
            const httpStorageEngine = new HTTPStorageEngine({
                baseURL: 'https://example.com',
                prefix: 'api/v1',
                fetch: (_url, _options) => Promise.resolve({}),
            });

            const connectionName = 'http';

            const connection = Persist.registerConnection(
                connectionName,
                httpStorageEngine,
                [EmptyModel],
            );

            test('allows using the connection', () => {
                expect(connection).toBeInstanceOf(Persist.Connection);
            });

            test('allows creating a transaction', () => {
                expect(connection.transaction()).toBeInstanceOf(Persist.Connection);
            });

            test('allows retrieving the connection later', () => {
                expect(Persist.getConnection(connectionName)).toBeInstanceOf(Persist.Connection);
            });
        });
    });
});
