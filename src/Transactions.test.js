import {LinkedModel, getTestModelInstance, valid} from '../test/fixtures/TestModel.js';
import enableTransactions, {TransactionCommittedError} from './Transactions.js';
import {EngineError} from './engine/Engine.js';
import assertions from '../test/assertions.js';
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

test('transaction.commit() reverts already commited changes if the transaction fails', async t => {
    const model = LinkedModel.fromData({string: 'original'});
    model.id = 'LinkedModel/000000000000';
    const original = LinkedModel.fromData(model.toData());

    const testEngine = getTestEngine([original]);

    model.string = 'updated';

    testEngine.putModel.callsFake(async subject => {
        if (subject.string === 'updated') {
            throw new EngineError(`Failed to put model ${subject.id}`);
        }
    });

    const transactionalEngine = enableTransactions(testEngine);

    const transaction = transactionalEngine.start();

    await transaction.put(model);

    await t.throwsAsync(
        async () => await transaction.commit(),
        {
            instanceOf: EngineError,
            message: 'Failed to put model LinkedModel/000000000000',
        },
    );

    assertions.calledWith(t, testEngine.putModel, model);
    assertions.calledWith(t, testEngine.putModel, original);
});

test('transaction.commit() reverts already commited changes if the transaction fails for complex models', async t => {
    const model = getTestModelInstance(valid);
    const original = getTestModelInstance(valid);

    const testEngine = getTestEngine([original]);

    model.linked.string = 'updated';

    testEngine.putModel.callsFake(async subject => {
        if (subject.string === 'updated') {
            throw new EngineError(`Failed to put model ${subject.id}`);
        }
    });

    const transactionalEngine = enableTransactions(testEngine);

    const transaction = transactionalEngine.start();

    await transaction.put(model);

    await t.throwsAsync(
        async () => await transaction.commit(),
        {
            instanceOf: EngineError,
            message: 'Failed to put model LinkedModel/000000000000',
        },
    );

    assertions.calledWith(t, testEngine.putModel, model);
    assertions.calledWith(t, testEngine.putModel, original);
});