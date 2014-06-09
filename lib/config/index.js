'use strict';

var shien = require('shien'),
    defaultCfg = require('./default'),

    ENVIRONMENTS = [
        'development',
        'test',
        'staging',
        'production'
    ],

    config = null;

function Config() {
    this.configs = {};
}

Config.prototype = new function () {

    function deepClone(item) {
        if (!item) {
            return item;
        } // `null`, `undefined` values check

        var types = [ Number, String, Boolean ],
            result;

        // Normalizing primitives if someone did new String('aaa'), or new Number('444');
        types.forEach(function(type) {
            if (item instanceof type) {
                result = type(item);
            }
        });

        if (typeof result == 'undefined') {
            if (Object.prototype.toString.call(item) === '[object Array]') {
                result = [];
                item.forEach(function(child, index, array) {
                    result[index] = deepClone(child);
                });

            } else if (typeof item == 'object') {
                // Testing that this is DOM
                if (item.nodeType && typeof item.cloneNode == 'function') {
                    var result = item.cloneNode(true);

                } else if (!item.prototype) { // Check that this is a literal
                    if (item instanceof Date) {
                        result = new Date(item);

                    } else {
                        // It is an object literal
                        result = {};
                        for (var i in item) {
                            result[i] = deepClone(item[i]);
                        }
                    }

                } else {
                    // Depending what you would like here,
                    // Just keep the reference, or create new object
                    if (false && item.constructor) {
                        // would not advice to do that, reason? Read below
                        result = new item.constructor();

                    } else {
                        result = item;
                    }
                }

            } else {
                result = item;
            }
        }

        return result;
    }

    function checkEnvironment(env) {
        if (ENVIRONMENTS.indexOf(env) < 0) {
            throw new Error('Bad environment!', env);
        }
    }

    function getDefaultConfig(env) {
        return defaultCfg.get(env, ENVIRONMENTS.indexOf(env));
    }

    function configure(env, cfg) {
        /* jshint validthis: true */

        checkEnvironment(env);

        if (!this.configs[env]) {
            this.configs[env] = {};
        }

        if (typeof cfg === 'undefined') {
            return shien.merge(getDefaultConfig(env), this.configs[env]);
        }

        shien.merge(this.configs[env], cfg);
    }

    this.get = function (env) {
        return configure.call(this, env);
    };

    this.set = function (env, cfg) {
        return configure.call(this, env, cfg);
    };

    this.inherit = function (env, targetEnv, cfg) {
        checkEnvironment(env);
        checkEnvironment(targetEnv);
        this.set(env, deepClone(this.configs[targetEnv]));
        this.set(env, cfg);
    };

};

exports = module.exports = function loadConfig(env, configPath) {
    if (config) {
        return config;
    }

    // Return empty config for workers
    if (env === 'empty') {
        return (config = {});
    }

    config = new Config;

    if (configPath) {
        var fn = shien.load(configPath);

        if (typeof fn === 'function') {
            fn.call(config);
        }
    }

    return (config = config.get(env));
};

exports.environments = ENVIRONMENTS;
