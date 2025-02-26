import Type from '../../src/type/index.js';

/**
 * @class EmptyModel
 * @extends Type.Model
 */
export class EmptyModel extends Type.Model {
}

/**
 * @class SimpleModel
 * @extends Type.Model
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
 * Factory for an SimpleModel
 * @return {SimpleModel}
 * @constructor
 */
export function SimpleModelFactory() {
    return new SimpleModel({
        string: 'string',
        number: 1.4,
        boolean: true,
        date: new Date(),
    });
}

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
 * Factory for an SimpleModelWithIndex
 * @return {SimpleModelWithIndex}
 * @constructor
 */
export function SimpleModelWithIndexFactory() {
    return new SimpleModelWithIndex({
        string: 'string',
        number: 1.4,
        boolean: true,
        date: new Date(),
    });
}

export class LinkedModel extends EmptyModel {
    static {
        this.string = Type.String;
        this.linked = () => SimpleModel;
    }
}

export function LinkedModelFactory() {
    const linked = SimpleModelFactory();
    return new LinkedModel({
        string: 'string',
        linked,
    });
}

export class LinkedModelWithIndex extends EmptyModel {
    static {
        this.string = Type.String;
        this.linked = () => SimpleModelWithIndex;
        this.indexedProperties = () => ['string'];
    }
}

export function LinkedModelWithIndexFactory() {
    const linked = SimpleModelWithIndexFactory();
    return new LinkedModelWithIndex({
        string: 'string',
        linked,
    });
}

export class CircularLinkedModel extends EmptyModel {
    static {
        this.string = Type.String;
        this.linked = () => CircularLinkedModel;
    }
}

export function CircularLinkedModelFactory() {
    const linked = new CircularLinkedModel({string: 'linked'});
    const main = new CircularLinkedModel({string: 'main'});
    linked.linked = main;
    main.linked = linked;
    return main;
}

export class CircularLinkedModelWithIndex extends EmptyModel {
    static {
        this.string = Type.String;
        this.linked = () => CircularLinkedModelWithIndex;
        this.indexedProperties = () => ['string'];
    }
}

export function CircularLinkedModelWithIndexFactory() {
    const linked = new CircularLinkedModelWithIndex({string: 'linked'});
    const main = new CircularLinkedModelWithIndex({string: 'main'});
    linked.linked = main;
    main.linked = linked;
    return main;
}
