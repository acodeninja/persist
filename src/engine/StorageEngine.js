export default class StorageEngine {
    /**
     * @param {Object} configuration
     * @param {Array<Model>?} models
     */
    constructor(configuration, models = null) {
        this.configuration = configuration;
        this.models = Object.fromEntries((models ?? []).map(model => [model.name, model]));
    }
}
