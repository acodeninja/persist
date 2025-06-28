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
        LinkedModelWithIndex.string = Property.String;
        LinkedModelWithIndex.linked = () => SimpleModelWithIndex;
        LinkedModelWithIndex.indexedProperties = () => ['string', 'linked.string', 'linked.boolean'];
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
        LinkedModelWithSearchIndex.string = Property.String;
        LinkedModelWithSearchIndex.linked = () => SimpleModelWithSearchIndex;
        LinkedModelWithSearchIndex.indexedProperties = () => ['string'];
        LinkedModelWithSearchIndex.searchProperties = () => ['string'];
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
        CircularLinkedModel.string = Property.String;
        CircularLinkedModel.linked = () => CircularLinkedModel;
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
        CircularManyLinkedModel.string = Property.String;
        CircularManyLinkedModel.linked = Property.Array.of(CircularManyLinkedModel);
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
        CircularLinkedModelWithIndex.string = Property.String;
        CircularLinkedModelWithIndex.linked = () => CircularLinkedModelWithIndex;
        CircularLinkedModelWithIndex.indexedProperties = () => ['string'];
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
        CircularLinkedModelWithSearchIndex.string = Property.String;
        CircularLinkedModelWithSearchIndex.linked = () => CircularLinkedModelWithSearchIndex;
        CircularLinkedModelWithSearchIndex.indexedProperties = () => ['string'];
        CircularLinkedModelWithSearchIndex.searchProperties = () => ['string'];
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
        CircularRequiredLinkedModelWithSearchIndex.string = Property.String;
        CircularRequiredLinkedModelWithSearchIndex.linked = () => CircularRequiredLinkedModelWithSearchIndex.required;
        CircularRequiredLinkedModelWithSearchIndex.indexedProperties = () => ['string'];
        CircularRequiredLinkedModelWithSearchIndex.searchProperties = () => ['string'];
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
        RequiredLinkedModelWithSearchIndex.string = Property.String;
        RequiredLinkedModelWithSearchIndex.linked = SimpleModelWithSearchIndex.required;
        RequiredLinkedModelWithSearchIndex.indexedProperties = () => ['string'];
        RequiredLinkedModelWithSearchIndex.searchProperties = () => ['string'];
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

/**
 * @class PolymorphicTypeA
 * @extends Model
 */
export class PolymorphicTypeA extends Model {
    static {
        PolymorphicTypeA.withName('PolymorphicTypeA');
        PolymorphicTypeA.title = Property.String.required;
    }
}

/**
 * @class PolymorphicTypeB
 * @extends Model
 */
export class PolymorphicTypeB extends Model {
    static {
        PolymorphicTypeB.withName('PolymorphicTypeB');
        PolymorphicTypeB.title = Property.String.required;
    }
}

/**
 * @class ModelWithPolymorphicLink
 * @extends Model
 */
export class ModelWithPolymorphicLink extends Model {
    static {
        ModelWithPolymorphicLink.withName('ModelWithPolymorphicLink');
        ModelWithPolymorphicLink.label = Property.String.required;
        ModelWithPolymorphicLink.poly = Property.Any.of(Property.Boolean, Property.Number, Property.String);
        ModelWithPolymorphicLink.linked = () => Property.Any.of(PolymorphicTypeA, PolymorphicTypeB);
    }
}

/**
 *
 * @param {PolymorphicTypeA.constructor|PolymorphicTypeB.constructor} LinkedConstructor
 * @return {ModelWithPolymorphicLink}
 * @constructor
 */
export function ModelWithPolymorphicLinkFactory(LinkedConstructor) {
    const linked = new LinkedConstructor();
    linked.title = 'link title';
    const main = new ModelWithPolymorphicLink();
    main.linked = linked;
    main.label = 'label';
    main.poly = [false, 758, 'string'][Math.floor(Math.random() * 3)];

    return main;
}

/**
 * @class RequiredPolymorphicTypeAWithSearchIndex
 * @extends Model
 */
export class RequiredPolymorphicTypeAWithSearchIndex extends Model {
    static {
        RequiredPolymorphicTypeAWithSearchIndex.withName('RequiredPolymorphicTypeAWithSearchIndex');
        RequiredPolymorphicTypeAWithSearchIndex.title = Property.String.required;
        RequiredPolymorphicTypeAWithSearchIndex.indexedProperties = () => ['title'];
        RequiredPolymorphicTypeAWithSearchIndex.searchProperties = () => ['title'];
    }
}

/**
 * @class RequiredPolymorphicTypeBWithSearchIndex
 * @extends Model
 */
export class RequiredPolymorphicTypeBWithSearchIndex extends Model {
    static {
        RequiredPolymorphicTypeBWithSearchIndex.withName('RequiredPolymorphicTypeBWithSearchIndex');
        RequiredPolymorphicTypeBWithSearchIndex.title = Property.String.required;
        RequiredPolymorphicTypeBWithSearchIndex.indexedProperties = () => ['title'];
        RequiredPolymorphicTypeBWithSearchIndex.searchProperties = () => ['title'];
    }
}

/**
 * @class RequiredModelWithPolymorphicLinkWithSearchIndex
 * @extends Model
 */
export class RequiredModelWithPolymorphicLinkWithSearchIndex extends Model {
    static {
        RequiredModelWithPolymorphicLinkWithSearchIndex.withName('RequiredModelWithPolymorphicLinkWithSearchIndex');
        RequiredModelWithPolymorphicLinkWithSearchIndex.label = Property.String.required;
        RequiredModelWithPolymorphicLinkWithSearchIndex.linked = () => Property.Any.of(RequiredPolymorphicTypeAWithSearchIndex, RequiredPolymorphicTypeBWithSearchIndex).required;
        RequiredModelWithPolymorphicLinkWithSearchIndex.indexedProperties = () => ['label'];
        RequiredModelWithPolymorphicLinkWithSearchIndex.searchProperties = () => ['label'];
    }
}

/**
 *
 * @param {RequiredPolymorphicTypeAWithSearchIndex.constructor|RequiredPolymorphicTypeBWithSearchIndex.constructor} LinkedConstructor
 * @return {RequiredModelWithPolymorphicLinkWithSearchIndex}
 * @constructor
 */
export function RequiredModelWithPolymorphicLinkWithSearchIndexFactory(LinkedConstructor) {
    const linked = new LinkedConstructor();
    linked.title = 'link title';
    const main = new RequiredModelWithPolymorphicLinkWithSearchIndex();
    main.linked = linked;
    main.label = 'label';

    return main;
}

/**
 * @class PolymorphicTypeAWithSearchIndex
 * @extends Model
 */
export class PolymorphicTypeAWithSearchIndex extends Model {
    static {
        PolymorphicTypeAWithSearchIndex.withName('PolymorphicTypeAWithSearchIndex');
        PolymorphicTypeAWithSearchIndex.title = Property.String.required;
        PolymorphicTypeAWithSearchIndex.indexedProperties = () => ['title'];
        PolymorphicTypeAWithSearchIndex.searchProperties = () => ['title'];
    }
}

/**
 * @class PolymorphicTypeBWithSearchIndex
 * @extends Model
 */
export class PolymorphicTypeBWithSearchIndex extends Model {
    static {
        PolymorphicTypeBWithSearchIndex.withName('PolymorphicTypeBWithSearchIndex');
        PolymorphicTypeBWithSearchIndex.title = Property.String.required;
        PolymorphicTypeBWithSearchIndex.indexedProperties = () => ['title'];
        PolymorphicTypeBWithSearchIndex.searchProperties = () => ['title'];
    }
}

/**
 * @class ModelWithPolymorphicLinkWithSearchIndex
 * @extends Model
 */
export class ModelWithPolymorphicLinkWithSearchIndex extends Model {
    static {
        ModelWithPolymorphicLinkWithSearchIndex.withName('ModelWithPolymorphicLinkWithSearchIndex');
        ModelWithPolymorphicLinkWithSearchIndex.label = Property.String.required;
        ModelWithPolymorphicLinkWithSearchIndex.linked = () => Property.Any.of(PolymorphicTypeAWithSearchIndex, PolymorphicTypeBWithSearchIndex);
        ModelWithPolymorphicLinkWithSearchIndex.indexedProperties = () => ['label'];
        ModelWithPolymorphicLinkWithSearchIndex.searchProperties = () => ['label'];
    }
}

/**
 *
 * @param {PolymorphicTypeAWithSearchIndex.constructor|PolymorphicTypeBWithSearchIndex.constructor} LinkedConstructor
 * @return {ModelWithPolymorphicLinkWithSearchIndex}
 * @constructor
 */
export function ModelWithPolymorphicLinkWithSearchIndexFactory(LinkedConstructor) {
    const linked = new LinkedConstructor();
    linked.title = 'link title';
    const main = new ModelWithPolymorphicLinkWithSearchIndex();
    main.linked = linked;
    main.label = 'label';

    return main;
}
