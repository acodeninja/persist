import ArrayType from './complex/ArrayType.js';
import BooleanType from './simple/BooleanType.js';
import CustomType from './complex/CustomType.js';
import DateType from './simple/DateType.js';
import Model from './Model.js';
import NumberType from './simple/NumberType.js';
import SlugType from './resolved/SlugType.js';
import StringType from './simple/StringType.js';

/**
 * @class Type
 * @property {StringType} String
 * @property {NumberType} Number
 * @property {BooleanType} Boolean
 * @property {DateType} Date
 * @property {ArrayType} Array
 * @property {CustomType} Custom
 * @property {{Slug: SlugType}} Resolved
 * @property {Model} Model
 */
class Type {
    static Model = Model;
    static String = StringType;
    static Number = NumberType;
    static Boolean = BooleanType;
    static Date = DateType;
    static Array = ArrayType;
    static Custom = CustomType;
    static Resolved = {Slug: SlugType};
}

export default Type;
