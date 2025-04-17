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

    static #connections = new Map();

    /**
     * Register a new connection.
     * @param {string} name
     * @param {StorageEngine} storage
     * @param {Array<Model.constructor>} models
     * @return {Connection}
     */
    static registerConnection(name, storage, models) {
        const connection = new Connection(storage, models);

        Persist.#connections.set(name, connection);

        return connection;
    }

    /**
     * Get a persist connection by its name.
     * @param {string} name
     * @return {Connection|undefined}
     */
    static getConnection(name) {
        return Persist.#connections.get(name);
    }
}

export default Persist;
