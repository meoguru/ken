'use strict';

var ken = require('../ken'),

    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    schemaProto = Schema.prototype;

exports.setup = function () {
    var defaultOptions = schemaProto.defaultOptions,
        plugin = schemaProto.plugin;

    schemaProto.defaultOptions = function () {
        var opts = defaultOptions.apply(this, arguments);

        if (typeof ken.options.autoIndex !== 'undefined') {
            opts.autoIndex = ken.options.autoIndex;

        } else {
            opts.autoIndex = !ken.isLiveEnv;
        }

        return opts;
    };

    schemaProto.plugin = function (plg) {
        if (typeof plg === 'string') {
            arguments[0] = ken.app.modelPlugin(plg);
        }

        plugin.apply(this, arguments);
    };
};
