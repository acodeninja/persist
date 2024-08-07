import {inspect} from 'node:util';

function parseArgument(arg) {
    try {
        return JSON.parse(JSON.stringify(arg));
    } catch (_) {
        return arg;
    }
}

export const not = {
    calledWith: (t, spy, ...args) => {
        t.throws(() => calledWith(t, spy, ...args));
    },
};

export function calledWith(t, spy, ...args) {
    for (const call of spy.getCalls()) {
        const calledArguments = call.args.map(parseArgument);
        const expectedArguments = args.map(parseArgument);

        if (JSON.stringify(expectedArguments) === JSON.stringify(calledArguments)) {
            t.like(calledArguments, expectedArguments);
            return;
        }
    }

    const error = new Error(`${spy.name} was not called with the given arguments`);
    error.calls = inspect(spy.getCalls().map(c => c.args).map(a => a.map(parseArgument)), {depth: 8, colors: true});
    error.expected = inspect(args.map(parseArgument), {depth: 8, colors: true});
    throw error;
}

export default {calledWith, not};
