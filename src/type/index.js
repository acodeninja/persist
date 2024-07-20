import StringType from './simple/StringType.js';
import NumberType from './simple/NumberType.js';
import BooleanType from './simple/BooleanType.js';
import ArrayType from './complex/ArrayType.js';
import SlugType from './resolved/SlugType.js';
import Model from './Model.js';
import CustomType from './complex/CustomType.js';

const Type = {};

Type.String = StringType;
Type.Number = NumberType;
Type.Boolean = BooleanType;
Type.Array = ArrayType;
Type.Custom = CustomType;
Type.Resolved = {Slug: SlugType};
Type.Model = Model;

export default Type;
