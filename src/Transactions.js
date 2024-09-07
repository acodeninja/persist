class TransactionError extends Error {
}

export class TransactionCommittedError extends TransactionError {
    message = 'Transaction was already committed.';
}

export default function enableTransactions(engine) {
    class TransactionalEngine extends engine {
    }

    TransactionalEngine.start = () => {
        class Transaction extends TransactionalEngine {
            static transactions = [];
            static committed = false;
            static failed = false;

            static async putModel(...args) {
                this.transactions.push({
                    hasRun: false,
                    method: 'putModel',
                    args,
                });
            }

            static async putIndex(...args) {
                this.transactions.push({
                    hasRun: false,
                    method: 'putIndex',
                    args,
                });
            }

            static async putSearchIndexCompiled(...args) {
                this.transactions.push({
                    hasRun: false,
                    method: 'putSearchIndexCompiled',
                    args,
                });
            }

            static async putSearchIndexRaw(...args) {
                this.transactions.push({
                    hasRun: false,
                    method: 'putSearchIndexCompiled',
                    args,
                });
            }

            static _checkCommitted() {
                if (this.committed) throw new TransactionCommittedError();
            }

            static async commit() {
                this._checkCommitted();

                for (const [index, {method, args}] of this.transactions.entries()) {
                    await engine[method](...args);
                    this.transactions[index].hasRun = true;
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
