#!/usr/bin/env node

'use strict';

var path = require('path'),
    when = require('when'),

    ken = require('../lib/ken'),

    mongoose = require('mongoose'),
    Model = mongoose.Model;

// Create indexes for database collections
ken.setup({ autoIndex: false }, function (err) {
    if (err) {
        throw err;
    }

    var pathConsts = ken.consts.path,
        fileUtils = ken.utils.file;

    var files = fileUtils.traverseSync(pathConsts.APP_MODELS, {
            match: fileUtils.regexs.JS
        }),

        modelNames = files.map(function (file) {
            return path.join(
                path.dirname(file),
                path.basename(file, path.extname(file))
            );
        });

    modelNames.forEach(function (modelName) {
        ken.model(modelName);
    });

    var created = {};

    return when.map(modelNames, function (modelName) {
            var model = ken.model(modelName);

            if (model.__proto__ !== Model ||
                created[model.collection.name]) {
                return;
            }

            created[model.collection.name] = true;

            var df = when.defer();

            model.ensureIndexes(function (err) {
                return (err ? df.reject(err) : df.resolve());
            });

            return df.promise;
        })
        .done(
            function () {
                ken.info('Created all database indexes successfully.');
                process.exit(0);
            },
            function (err) {
                var msg = err instanceof Error ? err.stack : err;
                ken.error('Failed to create database indexes!', msg);
                process.exit(1);
            }
        );
});
