'use strict';

var _ = require('lodash'),

    ken = require('../ken'),
    utils = ken.utils;

var environments = exports.envs = {
    DEV: 'development',
    TEST: 'test',
    STAGING: 'staging',
    PROD: 'production'
};

function getEnvironmentIndex(env) {
    var idx = 0;

    for (var prop in environments) {
        if (environments[prop] === env) {
            return idx;
        }
        idx++;
    }

    return -1;
};

var Config = exports.Config = function () {
    this.configs = {};
};

Config.prototype = new function () {

    function checkEnvironment(env) {
        if (getEnvironmentIndex(env) < 0) {
            throw new Error('Bad environment `' + env + '`!');
        }
    }

    function getDefaultConfig(env) {
        var defaultCfg = require('./default')
        return defaultCfg.get(env, getEnvironmentIndex(env));
    }

    function configure(env, cfg) {
        /* jshint validthis: true */

        checkEnvironment(env);

        if (!this.configs[env]) {
            this.configs[env] = {};
        }

        if (typeof cfg === 'undefined') { // getter
            var ret = { env: env };

            _.merge(ret, getDefaultConfig(env));
            _.merge(ret, this.configs[env]);

            return ret;
        }

        _.merge(this.configs[env], cfg);
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
        this.set(env, _.cloneDeep(this.configs[targetEnv]));
        this.set(env, cfg);
    };

};

exports.isLiveEnv = function (env) {
    return (getEnvironmentIndex(env) >=
        getEnvironmentIndex(environments.STAGING));
};

function load() {
    var configs = new Config,
        fn = utils.load(ken.consts.path.CONFIG);

    if (typeof fn === 'function') {
        fn.call(configs);
    }

    return configs;
}

exports.setup = function (env) {
    ken.config = load().get(env);
};
