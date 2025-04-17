import Persist from '../../../src/Persist.js';

class TestModel extends Persist.Model {
    static {
        this.withName('TestModel');
        this.string = Persist.Property.String;
    }
}

/**
 * Returns the test model class
 *
 * @return {TestModel}
 */
export const getModel = () => TestModel;
