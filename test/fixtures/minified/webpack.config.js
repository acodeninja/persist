import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export default {
    entry: './main.js',
    mode: 'production',
    experiments: {
        outputModule: true,
    },
    output: {
        filename: 'main.bundle.js',
        path: resolve(dirname(fileURLToPath(import.meta.url))),
        library: {
            type: 'module',
        },
    },
};
