#!/usr/bin/env node

'use strict';

var minimist = require('minimist'),
    when = require('when'),

    ken = require('../lib/ken');

function yell(msg) {
    (ken.info ? ken.info : console.info)(msg);
    process.exit(0);
}

function die(err) {
    (err instanceof Error) && (err = err.stack);
    (ken.error ? ken.error : console.error)(err);
    process.exit(1);
}

var argv = minimist(process.argv.slice(2)),
    args = argv._;

delete argv._;

if (!args.length) {
    return ken.start()
        .done(
            function startedSuccessfully() {},
            function failedToStart(err) {
                die(err);
            }
        );
}

if (args[0] === 'export') {
    args.shift();

    /*
    if (!args.length) {
        return die('Export what!?');
    }
    */

    var exporter = require('../lib/cli/exporter');

    ken.init().then(function exportAll() {
        return when.join(
            exporter.exportRoutes(),
            exporter.exportViews()
        );
    })
    .done(
        function startedSuccessfully() {
            yell('Exported successfully!');
        },
        function failedToStart(err) {
            die(err);
        }
    );
}
