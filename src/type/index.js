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
 * @property {ResolvedType} Resolved
 * @property {Model} Model
 */
const Type = {};

Type.String = StringType;
Type.Number = NumberType;
Type.Boolean = BooleanType;
Type.Date = DateType;
Type.Array = ArrayType;
Type.Custom = CustomType;

/**
 * @class ResolvedType
 * @property {SlugType} Slug
 */
Type.Resolved = {Slug: SlugType};
Type.Model = Model;

export default Type;
