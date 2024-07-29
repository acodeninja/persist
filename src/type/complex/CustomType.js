import Type from '../Type.js';
import ajv from 'ajv';

export default class CustomType {
    static of(schema) {
        new ajv().compile(schema);

        class Custom extends Type {
            static _type = 'object';
            static _schema = schema;
        }

        return Custom;
    }
}
