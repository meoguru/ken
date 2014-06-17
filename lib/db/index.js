'use strict';

var path = require('path'),

    async = require('async'),

    mongoose = require('mongoose'),
    Schema = mongoose.Schema,

    redis = require('redis'),

    ken = require('../ken'),
    utils = ken.utils,

    log = require('./log');

ken.mongoose = mongoose;
ken.redis = redis;

exports.modelize = function (schema, fullPath) {
    if (!(schema instanceof Schema)) {
        return schema;
    }

    var name = path.relative(
            ken.consts.path.APP_MODELS,
            fullPath
        ),
        basename = path.basename(name);

    if (basename === 'index') {
        var parts = name.split(path.sep);

        if (parts.length > 1) {
            parts.pop();
            name = parts.join(path.sep);
        }
    }

    return mongoose.model(name, schema);
};

function connect(cb) {
    var config = ken.config,
        mongoConfig = config.mongo,
        redisConfig = config.redis;

    async.parallel([
        mongoose.connect.bind(
            mongoose,
            mongoConfig.host,
            mongoConfig.db,
            mongoConfig.port,
            mongoConfig.options
        ),
        function (cb) {
            var redisClient = redis.createClient(
                redisConfig.port,
                redisConfig.host
            );

            redisClient.select(redisConfig.db, function (err) {
                if (err) {
                    return cb(err);
                }
                cb(null, redisClient);
            });
        }
    ], function (err, results) {
        cb(err, (err ? null : results[1]));
    });
}

exports.setup = function (cb) {
    cb = utils.callbackify(cb);

    mongoose.set('debug', log.method);

    var schema = require('./schema'),
        query = require('./query');

    schema.setup();
    query.setup();

    connect(function (err, redisClient) {
        if (err) {
            return cb(err);
        }

        ken.redisClient = redisClient;
        cb();
    });
};
