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

            static put(model) {
                this.transactions.push({
                    hasRun: false,
                    hasRolledBack: false,
                    model,
                });

                return Promise.resolve();
            }

            static _checkCommitted() {
                if (this.committed) throw new TransactionCommittedError();
            }

            static async commit() {
                this._checkCommitted();

                try {
                    for (const [index, {model}] of this.transactions.entries()) {
                        try {
                            this.transactions[index].original = await engine.get(model.constructor, model.id);
                        } catch (_) {
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
