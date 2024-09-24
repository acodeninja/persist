import Model from '../src/type/Model.js';
import {inspect} from 'node:util';

function parseArgument(arg) {
    try {
        if (Model.isModel(arg)) {
            return JSON.parse(JSON.stringify(arg.toData()));
        }
        return JSON.parse(JSON.stringify(arg));
    } catch (_error) {
        return arg;
    }
}

/**
 * Checks if a spy function was called with the specified arguments.
 *
 * This function iterates through all calls made to the provided spy and compares the arguments
 * of each call with the expected arguments. If a match is found, it asserts that the arguments
 * match using the provided test function. If no match is found, it throws an error detailing
 * the expected and actual arguments.
 *
 * @param {Object} t - The test object that provides assertion methods, such as `like`.
 * @param {Function} spy - The spy function whose calls are being inspected.
 * @param {...*} args - The expected arguments that should match one of the spy's calls.
 *
 * @throws {Error} If the spy was not called with the given arguments, an error is thrown
 * containing details about the actual calls and expected arguments.
 */
function calledWith(t, spy, ...args) {
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

export default {calledWith};
