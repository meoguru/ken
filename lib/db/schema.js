'use strict';

var path = require('path'),

    _ = require('lodash'),

    ken = require('../ken'),
    utils = ken.utils,

    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    schemaProto = Schema.prototype;

exports.setup = function () {
    var defaultOptions = schemaProto.defaultOptions,
        plugin = schemaProto.plugin,
        model = mongoose.model;

    schemaProto.defaultOptions = function () {
        var opts = defaultOptions.apply(this, arguments),
            kenOpts = ken.options;

        if (kenOpts.autoIndex) {
            opts.autoIndex = kenOpts.autoIndex;

        } else {
            opts.autoIndex = !ken.isLiveEnv;
        }

        return opts;
    };

    schemaProto.plugin = function (plg) {
        if (_.isString(plg)) {
            arguments[0] = ken.app.modelPlugin(plg);
        }

        plugin.apply(this, arguments);
    };

    mongoose.model = function (name, schema) {
        var err = new Error(),
            stack = err.stack.split('\n'),

            s = path.sep,
            p = [ s, 'node_modules', s, 'mongoose', s ].join(''),
            regex = new RegExp(p.replace(/(\\|\/)/g, '\\$1'));

        stack.some(function (call) {
            var matched = /\s\((.*):\d+:\d+\)$/.exec(call);

            if (!matched) {
                return;
            }

            var file = matched[1];

            if (file !== __filename && !regex.test(file)) {
                utils.implement(schema, file);
                return true;
            }
        });

        return model.apply(this, arguments);
    };
};
