'use strict';

var path = require('path'),

    shien = require('shien'),
    nodeFn = require('when/node'),
    yari = require('yari'),
    redis = require('redis'),

    paths = require('./variables').path,
    config = require('./config')(),

    db = null;

function Db() {
}

Db.prototype = new function () {

    function setupYari() {
        var modelize = yari.modelize,

            ModelCreator = yari.ModelCreator,
            applyPlugin = ModelCreator.prototype.plugin;

        yari.modelize = function (name, creator, opts) {
            if (typeof name !== 'string') {
                throw new Error('Bad model name!');
            }

            var set = false;

            if (typeof creator === 'function') {
                set = true;

            } else if (!this.models[name]) {
                var p = path.join(paths.MODELS, name),
                    pp = paths.MODEL_PLUGINS;

                // Check if this is the path of a model plugin
                if (p.slice(0, pp.length) === pp &&
                        (pp.length <= p.length || p.charAt(pp.length) === '/' )) {
                    return null;
                }

                creator = shien.load(p);
                opts = creator.options || {};

                if (opts.private) {
                    return null;
                }

                set = true;
            }

            if (set) {
                return modelize.call(this, name, creator, opts);
            }

            return modelize.call(this, name);
        };

        ModelCreator.prototype.plugin = function (plugin, opts) {
            if (typeof plugin === 'string') {
                plugin = require('./app')().modelPlugin(plugin);
            }

            return applyPlugin.call(this, plugin, opts);
        };
    }

    this.init = function () {
        var self = this;

        setupYari();

        this.yari = yari;
        this.redis = redis;

        return yari.connect({
                host: config.mongo.host,
                port: config.mongo.port,
                db: config.mongo.db
            })
            .then(function createRedisClient() {
                var redisClient = redis.createClient(
                        config.redis.port,
                        config.redis.host
                    ),
                    select = nodeFn.lift(redisClient.select.bind(redisClient));

                self.redisClient = redisClient;

                return select(config.redis.db);
            });
    };

};

module.exports = function loadDb() {
    if (db) {
        return db;
    }

    return (db = new Db);
};
