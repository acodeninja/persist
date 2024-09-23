import {CircularManyModel, CircularModel, LinkedManyModel, LinkedModel, MainModel} from './Models.js';
import lunr from 'lunr';

export class Models {
    constructor() {
        this.models = {};
    }

    addModel(model) {
        this.models[model.id] = model;
    }

    getIndex(model = undefined, additionalIndexData = {}) {
        if (model) {
            return Object.fromEntries(
                Object.entries(additionalIndexData)
                    .concat(
                        Object.entries(this.models)
                            .filter(([id, _]) => id.startsWith(`${model.name}/`))
                            .map(([_, model]) => [model.id, model.toIndexData()])
                            .concat(Object.entries(additionalIndexData)),
                    ),
            );
        }

        return Object.fromEntries(
            Object.entries(additionalIndexData)
                .concat(
                    Object.entries(this.models)
                        .map(([_, model]) => [model.id, model.toIndexData()])
                        .concat(Object.entries(additionalIndexData)),
                ),
        );
    }

    getRawSearchIndex(model, additionalSearchData = {}) {
        return Object.fromEntries(
            Object.entries(additionalSearchData)
                .concat(
                    Object.entries(this.models)
                        .filter(([id, _]) => id.startsWith(`${model.name}/`))
                        .map(([_, model]) => [model.id, model.toSearchData()]),
                ),
        );
    }

    getSearchIndex(model, additionalSearchData = {}) {
        const rawSearchIndex = this.getRawSearchIndex(model);
        return lunr(function () {
            this.ref('id');

            for (const field of model.searchProperties()) {
                this.field(field);
            }

            Object.values({
                ...additionalSearchData,
                ...rawSearchIndex,
            }).forEach(function (doc) {
                this.add(doc);
            }, this);
        });
    }

    getNumericId(modelInstance) {
        return parseInt(modelInstance.id.replace(`${modelInstance.constructor.name}/`, ''));
    }

    getNextModelId(modelInstance) {
        const lastId = Object.values(this.models)
            .filter(m => m.id.startsWith(`${modelInstance.constructor.name}/`))
            .map(m => this.getNumericId(m))
            .toSorted((a, b) => a - b)
            .pop();

        return `${modelInstance.constructor.name}/${(lastId + 1 || 0).toString(10).padStart(12, '0')}`;
    }

    createFullTestModel(override = {}) {
        const defaults = {
            string: 'test',
            requiredString: 'required test',
            number: 24.3,
            requiredNumber: 12.2,
            boolean: false,
            requiredBoolean: true,
            date: new Date(),
            requiredDate: new Date(),
            emptyArrayOfStrings: [],
            emptyArrayOfNumbers: [],
            emptyArrayOfBooleans: [],
            emptyArrayOfDates: [],
            arrayOfString: ['test'],
            arrayOfNumber: [24.5],
            arrayOfBoolean: [false],
            arrayOfDate: [new Date()],
            requiredArrayOfString: ['test'],
            requiredArrayOfNumber: [24.5],
            requiredArrayOfBoolean: [false],
            requiredArrayOfDate: [new Date()],
        };

        const model = new MainModel({...defaults, ...override});
        model.id = this.getNextModelId(model);
        this.addModel(model);

        const linked = new LinkedModel({string: 'test'});
        linked.id = this.getNextModelId(linked);
        model.linked = linked;
        this.addModel(linked);

        const requiredLinked = new LinkedModel({string: 'test'});
        requiredLinked.id = this.getNextModelId(requiredLinked);
        model.requiredLinked = requiredLinked;
        this.addModel(requiredLinked);


        const circular = new CircularModel({linked: model});
        circular.id = this.getNextModelId(circular);
        model.circular = circular;
        this.addModel(circular);

        const circularMany = new CircularManyModel({linked: [model]});
        circularMany.id = this.getNextModelId(circularMany);
        model.circularMany = [circularMany];
        this.addModel(circularMany);


        const linkedMany = new LinkedManyModel({string: 'many'});
        linkedMany.id = this.getNextModelId(linkedMany);
        model.linkedMany = [linkedMany];
        this.addModel(linkedMany);

        return model;
    }
}
