import {LinkedModel, MainModel} from '../test/fixtures/Models.js';
import enableTransactions, {TransactionCommittedError} from './Transactions.js';
import {expect, test} from '@jest/globals';
import {EngineError} from './engine/storage/StorageEngine.js';
import {Models} from '../test/fixtures/ModelCollection.js';
import {getTestEngine} from '../test/mocks/engine.js';

test('enableTransactions(StorageEngine) returns a copy of the engine', () => {
    const testEngine = getTestEngine();
    const transactionalEngine = enableTransactions(testEngine);

    expect(transactionalEngine.prototype).toEqual(testEngine.prototype);
});

test('enableTransactions(StorageEngine) leaves the original engine intact', () => {
    const testEngine = getTestEngine();
    const transactionalEngine = enableTransactions(testEngine);

    expect(transactionalEngine).not.toBe(testEngine);
});

test('transaction.put(model) calls putModel(model) on transaction.commit()', async () => {
    const model = new Models().createFullTestModel();
    const testEngine = getTestEngine();
    const transactionalEngine = enableTransactions(testEngine);

    const transaction = transactionalEngine.start();

    await transaction.put(model);

    expect(testEngine.putModel).not.toHaveBeenCalled();

    await transaction.commit();

    expect(testEngine.putModel).toHaveBeenCalledWith(model);
});

test('transaction.commit() throws an exception if the transaction was successfully commited before', async () => {
    const model = new Models().createFullTestModel();
    const testEngine = getTestEngine();
    const transactionalEngine = enableTransactions(testEngine);

    const transaction = transactionalEngine.start();

    await transaction.put(model);

    await transaction.commit();

    await expect(() => transaction.commit()).rejects.toThrowError({
        instanceOf: TransactionCommittedError,
        message: 'Transaction was already committed.',
    });
});

test('transaction.commit() throws an exception if the transaction fails', async () => {
    const model = new Models().createFullTestModel();
    const testEngine = getTestEngine();

    testEngine.putModel.mockImplementation(() => Promise.reject(new EngineError('Failed to put model')));

    const transactionalEngine = enableTransactions(testEngine);

    const transaction = transactionalEngine.start();

    await transaction.put(model);

    await expect(() => transaction.commit()).rejects.toThrowError({
        instanceOf: EngineError,
        message: 'Failed to put model',
    });
});

test('transaction.commit() reverts already commited changes if the transaction fails', async () => {
    const model = LinkedModel.fromData({string: 'original'});
    model.id = 'LinkedModel/000000000000';
    const original = LinkedModel.fromData(model.toData());

    const testEngine = getTestEngine([original]);

    model.string = 'updated';

    testEngine.putModel.mockImplementation(subject => {
        if (subject.string === 'updated') {
            return Promise.reject(new EngineError(`Failed to put model ${subject.id}`));
        }
        return Promise.resolve();
    });

    const transactionalEngine = enableTransactions(testEngine);

    const transaction = transactionalEngine.start();

    await transaction.put(model);

    await expect(() => transaction.commit())
        .rejects.toThrowError({
            instanceOf: EngineError,
            message: 'Failed to put model LinkedModel/000000000000',
        });

    expect(testEngine.putModel).toHaveBeenCalledWith(model);
    expect(testEngine.putModel).toHaveBeenCalledWith(original);
});

test('transaction.commit() reverts already commited changes if the transaction fails for complex models', async () => {
    const models = new Models();
    models.createFullTestModel();

    const testEngine = getTestEngine([...Object.values(models.models)]);

    testEngine.putModel.mockImplementation(subject => {
        if (subject.string === 'updated') {
            return Promise.reject(new EngineError(`Failed to put model ${subject.id}`));
        }
        return Promise.resolve();
    });

    const transactionalEngine = enableTransactions(testEngine);

    const transaction = transactionalEngine.start();

    const model = await transaction.hydrate(await transaction.get(MainModel, 'MainModel/000000000000'));

    model.linked.string = 'updated';

    await transaction.put(model);

    await expect(() => transaction.commit()).rejects.toThrowError({
        instanceOf: EngineError,
        message: 'Failed to put model LinkedModel/000000000000',
    });

    expect(testEngine.putModel).toHaveBeenCalledWith({
        id: 'LinkedModel/000000000000',
        string: 'updated',
        boolean: true,
    });
    expect(testEngine.putModel).toHaveBeenCalledWith({
        id: 'LinkedModel/000000000000',
        string: 'test',
        boolean: true,
    });
});
