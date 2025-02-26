import Type from '../../src/type/index.js';

/**
 * @class EmptyModel
 * @extends Type.Model
 */
export class EmptyModel extends Type.Model {
}

/**
 * @class SimpleModel
 * @extends EmptyModel
 */
export class SimpleModel extends EmptyModel {
    static {
        this.string = Type.String;
        this.number = Type.Number;
        this.boolean = Type.Boolean;
        this.date = Type.Date;
    }
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
    });
}

/**
 * @class SimpleModelWithIndex
 * @extends SimpleModel
 */
export class SimpleModelWithIndex extends SimpleModel {
    static {
        this.string = Type.String;
        this.number = Type.Number;
        this.boolean = Type.Boolean;
        this.date = Type.Date;
        this.indexedProperties = () => ['string', 'number'];
    }
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
    });
}

/**
 * @class SimpleModelWithSearchIndex
 * @extends SimpleModel
 */
export class SimpleModelWithSearchIndex extends SimpleModel {
    static {
        this.string = Type.String;
        this.number = Type.Number;
        this.boolean = Type.Boolean;
        this.date = Type.Date;
        this.indexedProperties = () => ['string', 'number'];
        this.searchProperties = () => ['string', 'number'];
    }
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
        this.string = Type.String;
        this.linked = () => SimpleModel;
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
        this.string = Type.String;
        this.linked = () => SimpleModelWithIndex;
        this.indexedProperties = () => ['string'];
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
 * @class LinkedModelWithSearchIndex
 * @extends EmptyModel
 */
export class LinkedModelWithSearchIndex extends EmptyModel {
    static {
        this.string = Type.String;
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
        this.string = Type.String;
        this.linked = () => CircularLinkedModel;
    }
}

/**
 * Factory for a CircularLinkedModel
 * @return {CircularLinkedModel}
 */
export function CircularLinkedModelFactory() {
    const linked = new CircularLinkedModel({string: 'linked'});
    const main = new CircularLinkedModel({string: 'main'});
    linked.linked = main;
    main.linked = linked;
    return main;
}

/**
 * @class CircularLinkedModelWithIndex
 * @extends EmptyModel
 */
export class CircularLinkedModelWithIndex extends EmptyModel {
    static {
        this.string = Type.String;
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
        this.string = Type.String;
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
