import Model from '../../src/data/Model.js';
import Property from '../../src/data/Property.js';

/**
 * @class SimpleModel
 * @extends Model
 */
export class SimpleModel extends Model {
    static string = Property.String.required;
    static number = Property.Number;
    static boolean = Property.Boolean;
    static date = Property.Date;
    static arrayOfString = Property.Array.of(Property.String);
    static arrayOfNumber = Property.Array.of(Property.Number);
    static arrayOfBoolean = Property.Array.of(Property.Boolean);
    static arrayOfDate = Property.Array.of(Property.Date);
    static stringSlug = Property.Slug.of('string');
}

/**
 * Factory for a SimpleModel
 * @return {SimpleModel}
 */
export function SimpleModelFactory() {
    return new SimpleModel({
        string: 'string',
        number: 1.4,
        boolean: true,
        date: new Date(),
        arrayOfString: ['string'],
        arrayOfNumber: [1.4],
        arrayOfBoolean: [true],
        arrayOfDate: [new Date()],
    });
}

/**
 * @class SimpleModelWithIndex
 * @extends Model
 */
export class SimpleModelWithIndex extends Model {
    static string = Property.String;
    static number = Property.Number;
    static boolean = Property.Boolean;
    static date = Property.Date;
    static arrayOfString = Property.Array.of(Property.String);
    static arrayOfNumber = Property.Array.of(Property.Number);
    static arrayOfBoolean = Property.Array.of(Property.Boolean);
    static arrayOfDate = Property.Array.of(Property.Date);
    static stringSlug = Property.Slug.of('string');
    static indexedProperties = () => ['number', 'string'];
}

/**
 * Factory for a SimpleModelWithIndex
 * @return {SimpleModelWithIndex}
 */
export function SimpleModelWithIndexFactory() {
    return new SimpleModelWithIndex({
        string: 'string',
        number: 1.4,
        boolean: true,
        date: new Date(),
        arrayOfString: ['string'],
        arrayOfNumber: [1.4],
        arrayOfBoolean: [true],
        arrayOfDate: [new Date()],
    });
}

/**
 * @class SimpleModelWithFullIndex
 * @extends Model
 */
export class SimpleModelWithFullIndex extends Model {
    static string = Property.String;
    static number = Property.Number;
    static boolean = Property.Boolean;
    static date = Property.Date;
    static arrayOfString = Property.Array.of(Property.String);
    static arrayOfNumber = Property.Array.of(Property.Number);
    static arrayOfBoolean = Property.Array.of(Property.Boolean);
    static arrayOfDate = Property.Array.of(Property.Date);
    static stringSlug = Property.Slug.of('string');
    static indexedProperties = () => [
        'string',
        'stringSlug',
        'number',
        'boolean',
        'date',
        'arrayOfString',
        'arrayOfNumber',
        'arrayOfBoolean',
        'arrayOfDate',
    ];
}

/**
 * Factory for a SimpleModelWithFullIndex
 * @return {SimpleModelWithFullIndex}
 */
export function SimpleModelWithFullIndexFactory() {
    return new SimpleModelWithFullIndex({
        string: 'string',
        number: 1.4,
        boolean: true,
        date: new Date(),
        arrayOfString: ['string'],
        arrayOfNumber: [1.4],
        arrayOfBoolean: [true],
        arrayOfDate: [new Date()],
    });
}

/**
 * @class SimpleModelWithSearchIndex
 * @extends Model
 */
export class SimpleModelWithSearchIndex extends Model {
    static string = Property.String;
    static number = Property.Number;
    static boolean = Property.Boolean;
    static date = Property.Date;
    static arrayOfString = Property.Array.of(Property.String);
    static arrayOfNumber = Property.Array.of(Property.Number);
    static arrayOfBoolean = Property.Array.of(Property.Boolean);
    static arrayOfDate = Property.Array.of(Property.Date);
    static indexedProperties = () => ['string', 'boolean', 'number'];
    static searchProperties = () => ['string', 'number'];
}

/**
 * Factory for a SimpleModelWithSearchIndex
 * @return {SimpleModelWithSearchIndex}
 */
export function SimpleModelWithSearchIndexFactory() {
    return new SimpleModelWithSearchIndex({
        string: 'string',
        number: 1.4,
        boolean: true,
        date: new Date(),
    });
}

/**
 * @class LinkedModel
 * @extends Model
 */
export class LinkedModel extends Model {
    static {
        LinkedModel.string = Property.String;
        LinkedModel.linked = SimpleModel;
    }
}

/**
 * Factory for a LinkedModel
 * @return {LinkedModel}
 */
export function LinkedModelFactory() {
    const linked = SimpleModelFactory();
    return new LinkedModel({
        string: 'string',
        linked,
    });
}

/**
 * @class LinkedModelWithIndex
 * @extends Model
 */
export class LinkedModelWithIndex extends Model {
    static {
        this.string = Property.String;
        this.linked = () => SimpleModelWithIndex;
        this.indexedProperties = () => ['string', 'linked.string', 'linked.boolean'];
    }
}

/**
 * Factory for a LinkedModelWithIndex
 * @return {LinkedModelWithIndex}
 */
export function LinkedModelWithIndexFactory() {
    const linked = SimpleModelWithIndexFactory();
    return new LinkedModelWithIndex({
        string: 'string',
        linked,
    });
}

/**
 * @class LinkedManyModelWithIndex
 * @extends Model
 */
export class LinkedManyModelWithIndex extends Model {
    static string = Property.String;
    static linked = () => Property.Array.of(SimpleModelWithIndex);
    static indexedProperties = () => ['string', 'linked.[*].string'];
}

/**
 * Factory for a LinkedManyModelWithIndex
 * @return {LinkedManyModelWithIndex}
 */
export function LinkedManyModelWithIndexFactory() {
    const linked = SimpleModelWithIndexFactory();
    return new LinkedManyModelWithIndex({
        string: 'string',
        linked: [linked],
    });
}

/**
 * @class LinkedManyModelWithSearchIndex
 * @extends Model
 */
export class LinkedManyModelWithSearchIndex extends Model {
    static string = Property.String;
    static linked = () => Property.Array.of(SimpleModelWithSearchIndex);
    static indexedProperties = () => ['string', 'linked.[*].string'];
    static searchProperties = () => ['string', 'linked.[*].string'];
}

/**
 * Factory for a LinkedManyModelWithSearchIndex
 * @return {LinkedManyModelWithSearchIndex}
 */
export function LinkedManyModelWithSearchIndexFactory() {
    const linked = SimpleModelWithSearchIndexFactory();
    return new LinkedManyModelWithSearchIndex({
        string: 'string',
        linked: [linked],
    });
}

/**
 * @class LinkedModelWithSearchIndex
 * @extends Model
 */
export class LinkedModelWithSearchIndex extends Model {
    static {
        this.string = Property.String;
        this.linked = () => SimpleModelWithSearchIndex;
        this.indexedProperties = () => ['string'];
        this.searchProperties = () => ['string'];
    }
}

/**
 * Factory for a LinkedModelWithSearchIndex
 * @return {LinkedModelWithSearchIndex}
 */
export function LinkedModelWithSearchIndexFactory() {
    const linked = SimpleModelWithSearchIndexFactory();
    return new LinkedModelWithSearchIndex({
        string: 'string',
        linked,
    });
}

/**
 * @class CircularLinkedModel
 * @extends Model
 */
export class CircularLinkedModel extends Model {
    static {
        this.string = Property.String;
        this.linked = () => CircularLinkedModel;
    }
}

/**
 * Factory for a CircularLinkedModel
 * @return {CircularLinkedModel}
 */
export function CircularLinkedModelFactory() {
    const linked = new CircularLinkedModel({string: 'linked'});
    const main = new CircularLinkedModel({string: 'string'});
    linked.linked = main;
    main.linked = linked;
    return main;
}

/**
 * @class CircularManyLinkedModel
 * @extends Model
 */
export class CircularManyLinkedModel extends Model {
    static {
        this.string = Property.String;
        this.linked = Property.Array.of(CircularManyLinkedModel);
    }
}

/**
 * Factory for a CircularManyLinkedModel
 * @return {CircularManyLinkedModel}
 */
export function CircularManyLinkedModelFactory() {
    const linked = new CircularManyLinkedModel({string: 'linked'});
    const main = new CircularManyLinkedModel({string: 'string'});
    linked.linked = [main];
    main.linked = [linked];
    return main;
}

/**
 * @class CircularLinkedModelWithIndex
 * @extends Model
 */
export class CircularLinkedModelWithIndex extends Model {
    static {
        this.string = Property.String;
        this.linked = () => CircularLinkedModelWithIndex;
        this.indexedProperties = () => ['string'];
    }
}

/**
 * Factory for a CircularLinkedModelWithIndex
 * @return {CircularLinkedModelWithIndex}
 */
export function CircularLinkedModelWithIndexFactory() {
    const linked = new CircularLinkedModelWithIndex({string: 'linked'});
    const main = new CircularLinkedModelWithIndex({string: 'main'});
    linked.linked = main;
    main.linked = linked;
    return main;
}

/**
 * @class CircularLinkedModelWithSearchIndex
 * @extends Model
 */
export class CircularLinkedModelWithSearchIndex extends Model {
    static {
        this.string = Property.String;
        this.linked = () => CircularLinkedModelWithSearchIndex;
        this.indexedProperties = () => ['string'];
        this.searchProperties = () => ['string'];
    }
}

/**
 * Factory for a CircularLinkedModelWithSearchIndex
 * @return {CircularLinkedModelWithSearchIndex}
 */
export function CircularLinkedModelWithSearchIndexFactory() {
    const linked = new CircularLinkedModelWithSearchIndex({string: 'linked'});
    const main = new CircularLinkedModelWithSearchIndex({string: 'main'});
    linked.linked = main;
    main.linked = linked;
    return main;
}

/**
 * @class CircularRequiredLinkedModelWithSearchIndex
 * @extends Model
 */
export class CircularRequiredLinkedModelWithSearchIndex extends Model {
    static {
        this.string = Property.String;
        this.linked = () => CircularRequiredLinkedModelWithSearchIndex.required;
        this.indexedProperties = () => ['string'];
        this.searchProperties = () => ['string'];
    }
}

/**
 * Factory for a CircularRequiredLinkedModelWithSearchIndex
 * @return {CircularRequiredLinkedModelWithSearchIndex}
 */
export function CircularRequiredLinkedModelWithSearchIndexFactory() {
    const linked = new CircularRequiredLinkedModelWithSearchIndex({string: 'linked'});
    const main = new CircularRequiredLinkedModelWithSearchIndex({string: 'main'});
    linked.linked = main;
    main.linked = linked;
    return main;
}

/**
 * @class RequiredLinkedModelWithSearchIndex
 * @extends Model
 */
export class RequiredLinkedModelWithSearchIndex extends Model {
    static {
        this.string = Property.String;
        this.linked = SimpleModelWithSearchIndex.required;
        this.indexedProperties = () => ['string'];
        this.searchProperties = () => ['string'];
    }
}

/**
 * Factory for a RequiredLinkedModelWithSearchIndex
 * @return {RequiredLinkedModelWithSearchIndex}
 */
export function RequiredLinkedModelWithSearchIndexFactory() {
    const linked = new SimpleModelWithSearchIndex({string: 'linked'});
    const main = new RequiredLinkedModelWithSearchIndex({string: 'main'});
    main.linked = linked;
    return main;
}
