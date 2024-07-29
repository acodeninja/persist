import ArrayType from './complex/ArrayType.js';
import BooleanType from './simple/BooleanType.js';
import CustomType from './complex/CustomType.js';
import Model from './Model.js';
import NumberType from './simple/NumberType.js';
import SlugType from './resolved/SlugType.js';
import StringType from './simple/StringType.js';

const Type = {};

Type.String = StringType;
Type.Number = NumberType;
Type.Boolean = BooleanType;
Type.Array = ArrayType;
Type.Custom = CustomType;
Type.Resolved = {Slug: SlugType};
Type.Model = Model;

export default Type;
