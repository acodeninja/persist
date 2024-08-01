import Persist from '@acodeninja/persist';
import S3Engine from '@acodeninja/persist/engine/s3';
import test from 'ava';

test('Persist allows adding the S3Engine', t => {
    Persist.addEngine('files', S3Engine, {
        path: '/tmp/fileEngine',
    });

    t.like(Persist._engine.files.S3Engine._configuration, {
        path: '/tmp/fileEngine',
    });
});

test('Persist allows retrieving a S3Engine', t => {
    Persist.addEngine('files', S3Engine, {
        path: '/tmp/fileEngine',
    });

    t.like(Persist.getEngine('files', S3Engine)._configuration, {
        path: '/tmp/fileEngine',
    });
});
