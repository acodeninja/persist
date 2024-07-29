import {inspect} from 'node:util';

function parseArgument(arg) {
    try {
        return JSON.parse(arg);
    } catch (_) {
        return arg;
    }
}

export function calledWith(t, spy, ...args) {
    const wasCalled = spy.calledWith(...args);

    if (wasCalled) return t.assert(wasCalled);

    for (const call of spy.getCalls()) {
        const calledArguments = call.args.map(parseArgument);
        const expectedArguments = args.map(parseArgument);

        if (calledArguments[0] === expectedArguments[0]) {
            t.like(calledArguments, expectedArguments);
        }
    }

    const error = new Error(`${spy.name} was not called with the given arguments`);
    error.calls = inspect(spy.getCalls().map(c => c.args).map(a => a.map(parseArgument)), {depth: 8, colors: true});
    error.expected = inspect(args.map(parseArgument), {depth: 8, colors: true});
    throw error;
}

export default {calledWith};
