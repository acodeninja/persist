import Model from '../../src/data/Model.js';
import Property from '../../src/data/Property.js';

/**
 * @class EmptyModel
 * @extends Model
 */
export class EmptyModel extends Model {
}

/**
 * @class SimpleModel
 * @extends EmptyModel
 */
export class SimpleModel extends EmptyModel {
    static string = Property.String;
    static number = Property.Number;
    static boolean = Property.Boolean;
    static date = Property.Date;
    static arrayOfString = Property.Array.of(Property.String);
    static arrayOfNumber = Property.Array.of(Property.Number);
    static arrayOfBoolean = Property.Array.of(Property.Boolean);
    static arrayOfDate = Property.Array.of(Property.Date);
    static stringSlug = Property.Slug.of('string');
    static indexProperties = () => [this.string, this.date];
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
 */
export class SimpleModelWithIndex extends EmptyModel {
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
 */
export class SimpleModelWithFullIndex extends EmptyModel {
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
 */
export class SimpleModelWithSearchIndex extends EmptyModel {
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
 * @extends EmptyModel
 */
export class LinkedModel extends EmptyModel {
    static {
        this.string = Property.String;
        this.linked = SimpleModel;
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
 * @extends EmptyModel
 */
export class LinkedModelWithIndex extends EmptyModel {
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
 * @extends EmptyModel
 */
export class LinkedManyModelWithIndex extends EmptyModel {
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
 * @class LinkedModelWithSearchIndex
 * @extends EmptyModel
 */
export class LinkedModelWithSearchIndex extends EmptyModel {
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
 * @extends EmptyModel
 */
export class CircularLinkedModel extends EmptyModel {
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
 * @extends EmptyModel
 */
export class CircularManyLinkedModel extends EmptyModel {
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
 * @extends EmptyModel
 */
export class CircularLinkedModelWithIndex extends EmptyModel {
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
 * @extends EmptyModel
 */
export class CircularLinkedModelWithSearchIndex extends EmptyModel {
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
 * @extends EmptyModel
 */
export class CircularRequiredLinkedModelWithSearchIndex extends EmptyModel {
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
 * @extends EmptyModel
 */
export class RequiredLinkedModelWithSearchIndex extends EmptyModel {
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
