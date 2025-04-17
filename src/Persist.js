import Connection from './Connection.js';
import Model from './data/Model.js';
import Property from './data/Property.js';
import {ValidationError} from './Schema.js';

/**
 * @class Persist
 */
class Persist {
    static Property = Property;
    static Model = Model;
    static Connection = Connection;

    static Errors = {
        ValidationError,
    };

    static #connections = {};

    /**
     * Register a new connection.
     * @param {string} name
     * @param {StorageEngine} storage
     * @param {Array<Model.constructor>} models
     * @return {Connection}
     */
    static registerConnection(name, storage, models) {
        this.#connections[name] = new Connection(storage, models);

        return this.getConnection(name);
    }

    /**
     * Get a persist connection by its name.
     * @param {string} name
     * @return {Connection|undefined}
     */
    static getConnection(name) {
        return this.#connections[name];
    }
}

export default Persist;
