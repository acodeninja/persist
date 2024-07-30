import Type from '../src/type/index.js';

/**
 * @class Persist
 */
export default class Persist {
    static _engine = {};
    /**
     * @memberof Persist
     * @type {Type}
     * @static
     */
    static Type = Type;

    /**
     * @function getEngine
     * @memberof Persist
     * @static
     * @param {string} group - Name of the group containing the engine
     * @param {Engine} engine - The engine class you wish to retrieve
     * @return {Engine|null}
     */
    static getEngine(group, engine) {
        return this._engine[group]?.[engine.name] ?? null;
    }

    /**
     * @function addEngine
     * @memberof Persist
     * @static
     * @param {string} group - Name of the group containing the engine
     * @param {Engine} engine - The engine class you wish to configure and add to the group
     * @param {object?} configuration - The configuration to use with the engine
     */
    static addEngine(group, engine, configuration) {
        if (!this._engine[group]) this._engine[group] = {};

        this._engine[group][engine.name] = engine.configure(configuration);
    }
}
