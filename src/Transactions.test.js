import enableTransactions, {TransactionCommittedError} from './Transactions.js';
import {getTestModelInstance, valid} from '../test/fixtures/TestModel.js';
import {EngineError} from './engine/Engine.js';
import {getTestEngine} from '../test/mocks/engine.js';
import test from 'ava';

test('enableTransactions(Engine) returns a copy of the engine', t => {
    const testEngine = getTestEngine();
    const transactionalEngine = enableTransactions(testEngine);

    t.deepEqual(transactionalEngine.prototype, testEngine.prototype);
});

test('enableTransactions(Engine) leaves the original engine intact', t => {
    const testEngine = getTestEngine();
    const transactionalEngine = enableTransactions(testEngine);

    t.not(transactionalEngine, testEngine);
});

test('transaction.put(model) calls putModel(model) on transaction.commit()', async t => {
    const model = getTestModelInstance(valid);
    const testEngine = getTestEngine();
    const transactionalEngine = enableTransactions(testEngine);

    const transaction = transactionalEngine.start();

    await transaction.put(model);

    t.false(testEngine.putModel.calledWith(model));

    await transaction.commit();

    t.true(testEngine.putModel.calledWith(model));
});

test('transaction.commit() throws an exception if the transaction was successfully commited before', async t => {
    const model = getTestModelInstance(valid);
    const testEngine = getTestEngine();
    const transactionalEngine = enableTransactions(testEngine);

    const transaction = transactionalEngine.start();

    await transaction.put(model);

    await transaction.commit();

    await t.throwsAsync(async () => await transaction.commit(), {
        instanceOf: TransactionCommittedError,
        message: 'Transaction was already committed.',
    });
});

test('transaction.commit() throws an exception if the transaction fails', async t => {
    const model = getTestModelInstance(valid);
    const testEngine = getTestEngine();

    testEngine.putModel.callsFake(async () => {
        throw new EngineError('Failed to put model');
    });

    const transactionalEngine = enableTransactions(testEngine);

    const transaction = transactionalEngine.start();

    await transaction.put(model);

    await t.throwsAsync(
        async () => await transaction.commit(),
        {
            instanceOf: EngineError,
            message: 'Failed to put model',
        },
    );
});
