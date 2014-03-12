'use strict';

var shien = require('shien'),
    defaultCfg = require('./default'),

    ENVIRONMENTS = [
        'development',
        'test',
        'stage',
        'production'
    ],

    config = null;

function Config() {
    this.configs = {};
}

Config.prototype = new function () {

    function checkEnvironment(env) {
        if (ENVIRONMENTS.indexOf(env) < 0) {
            throw new Error('Bad environment!', env);
        }
    }

    function getDefaultConfiguration(env) {
        return defaultCfg.get(env, ENVIRONMENTS.indexOf(env));
    }

    function configure(env, cfg) {
        /* jshint validthis: true */

        checkEnvironment(env);

        if (!this.configs[env]) {
            this.configs[env] = {};
        }

        if (typeof cfg === 'undefined') {
            return shien.merge(getDefaultConfiguration(env), this.configs[env]);
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
        this.set(env, this.configs[targetEnv]);
        this.set(env, cfg);
    };

};

function load(env, path) {
    if (config) {
        return config;
    }

    // Return empty config for workers
    if (env === 'empty') {
        return (config = {});
    }

    config = new Config;

    if (path) {
        var fn = shien.load(path);

        if (typeof fn === 'function') {
            fn.call(config);
        }
    }

    return (config = config.get(env));
}

exports = module.exports = load;
exports.environments = ENVIRONMENTS;
