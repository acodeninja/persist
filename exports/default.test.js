import {expect, test} from '@jest/globals';
import Persist from './default.js';

test('default exports Persist class', async () => {
    const imported = await import('./default.js');

    expect(imported.default).toBe(Persist);
});
