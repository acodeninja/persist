import ArrayType from './properties/ArrayType.js';
import BooleanType from './properties/BooleanType.js';
import CustomType from './properties/CustomType.js';
import DateType from './properties/DateType.js';
import NumberType from './properties/NumberType.js';
import SlugType from './properties/SlugType.js';
import StringType from './properties/StringType.js';
import Type from './properties/Type.js';

const Property = {
    Array: ArrayType,
    Boolean: BooleanType,
    Custom: CustomType,
    Date: DateType,
    Number: NumberType,
    Slug: SlugType,
    String: StringType,
    Type,
};

export default Property;
