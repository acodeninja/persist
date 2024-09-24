/**
 * Class representing a transaction-related error.
 *
 * @class TransactionError
 * @extends Error
 */
class TransactionError extends Error {
}

/**
 * Error thrown when a transaction is already committed.
 *
 * @class TransactionCommittedError
 * @extends TransactionError
 */
export class TransactionCommittedError extends TransactionError {
    /**
     * Creates an instance of TransactionCommittedError.
     * This error is thrown when attempting to commit an already committed transaction.
     * @property {string} message - The error message.
     */
    message = 'Transaction was already committed.';
}

/**
 * Enables transaction support for the provided engine.
 *
 * This function enhances an engine class with transaction capabilities, allowing multiple
 * changes to be grouped into a single transaction that can be committed or rolled back.
 *
 * @param {Engine.constructor} engine - The base engine class to be enhanced with transaction support.
 * @returns {TransactionalEngine.constructor} TransactionalEngine - The enhanced engine class with transaction functionality.
 */
export default function enableTransactions(engine) {
    /**
     * A class representing an engine with transaction capabilities.
     * @class TransactionalEngine
     * @extends {engine}
     */
    class TransactionalEngine extends engine {
    }

    /**
     * Starts a transaction on the engine. Returns a Transaction class that can handle
     * put, commit, and rollback actions for the transaction.
     *
     * @returns {Transaction.constructor} Transaction - A class that manages the transaction's operations.
     */
    TransactionalEngine.start = () => {
        /**
         * A class representing an active transaction on the engine.
         * Contains methods to put changes, commit the transaction, or roll back in case of failure.
         *
         * @class Transaction
         */
        class Transaction extends TransactionalEngine {
            /**
             * @property {Array<Object>} transactions - An array storing all the operations within the transaction.
             * @static
             */
            static transactions = [];

            /**
             * @property {boolean} committed - Indicates if the transaction has been committed.
             * @static
             */
            static committed = false;

            /**
             * @property {boolean} failed - Indicates if the transaction has failed.
             * @static
             */
            static failed = false;

            /**
             * Adds a model to the transaction queue.
             *
             * @param {Object} model - The model to be added to the transaction.
             * @returns {Promise<void>} A promise that resolves once the model is added.
             */
            static put(model) {
                this.transactions.push({
                    hasRun: false,
                    hasRolledBack: false,
                    model,
                });

                return Promise.resolve();
            }

            /**
             * Checks if the transaction has already been committed. If true, throws a TransactionCommittedError.
             *
             * @throws {TransactionCommittedError} If the transaction has already been committed.
             * @private
             */
            static _checkCommitted() {
                if (this.committed) throw new TransactionCommittedError();
            }

            /**
             * Commits the transaction, applying all the changes to the engine.
             * Rolls back if any part of the transaction fails.
             *
             * @returns {Promise<void>} A promise that resolves once the transaction is committed, or rejects if an error occurs.
             * @throws {Error} If any operation in the transaction fails.
             */
            static async commit() {
                this._checkCommitted();

                try {
                    for (const [index, {model}] of this.transactions.entries()) {
                        try {
                            this.transactions[index].original = await engine.get(model.constructor, model.id);
                        } catch (_error) {
                            this.transactions[index].original = null;
                        }

                        await engine.put(model);
                        this.transactions[index].hasRun = true;
                    }
                } catch (e) {
                    this.committed = true;
                    this.failed = true;
                    for (const [index, {original}] of this.transactions.entries()) {
                        if (original) {
                            await engine.put(this.transactions[index].original);
                        }
                        this.transactions[index].hasRolledBack = true;
                    }
                    throw e;
                }

                this.committed = true;
                this.failed = false;
            }
        }

        return Transaction;
    };

    Object.defineProperty(TransactionalEngine, 'name', {value: `${engine.toString()}`});

    return TransactionalEngine;
}
