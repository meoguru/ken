#!/usr/bin/env node

'use strict';

var ken = require('../lib/ken');

ken.start()
    .done(
        function startedSuccessfully() {},
        function failedToStart(err) {
            (ken.error ? ken.error : console.error)('Error occurred while starting Ken!', err);
            throw err;
        }
    );
