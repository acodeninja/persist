import Persist from '../../../src/Persist.js';

/**
 * @class TestModel
 * @extends {Persist.Model}
 */
class TestModel extends Persist.Model {
    static {
        TestModel.withName('TestModel');
        TestModel.string = Persist.Property.String;
    }
}

/**
 * Returns the test model class
 *
 * @return {TestModel}
 */
export const getModel = () => TestModel;
