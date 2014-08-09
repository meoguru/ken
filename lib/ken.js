'use strict';

var async = require('async'),
    express = require('express'),

    consts = require('./constants'),
    utils = require('./utils');

module.exports = new function () {

    this.consts = consts;
    this.utils = utils;

    function parseArguments(env, opts, cb) {
        var config = require('./config');

        if (typeof env !== 'string') {
            cb = opts;
            opts = env;
            env = process.env.NODE_ENV || config.envs.DEV;
        }

        if (typeof opts === 'function') {
            cb = opts;
            opts = {};
        }

        return [ env, opts, cb ];
    }

    this.setup = function (env, opts, cb) {
        var config = require('./config'),
            log = require('./log'),
            db = require('./db'),
            app = require('./app');

        var args = parseArguments(env, opts, cb);
        env = args[0], opts = args[1], cb = args[2];

        var self = this;

        this.env = process.env.NODE_ENV = env;
        this.isDevEnv = (env === config.envs.DEV);
        this.isLiveEnv = config.isLiveEnv(env);

        this.options = opts || {};

        config.setup(env);
        log.setup();

        async.series([
            db.setup,
            app.setup
        ], utils.callbackify(cb));
    };

    this.start = function (env, opts, cb) {
        var args = parseArguments(env, opts, cb);
        env = args[0], opts = args[1], cb = args[2];

        var self = this;

        async.series([
            self.setup.bind(
                self,
                env,
                opts
            ),
            function (cb) {
                self.app.listen(
                    self.config.port,
                    self.config.host,
                    function () {
                        self.info(
                            'Listening on http://%s:%d',
                            self.config.host,
                            self.config.port
                        );
                        cb();
                    }
                );
            }
        ], utils.callbackify(cb))
    };

};
