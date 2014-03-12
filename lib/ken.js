'use strict';

var cluster = require('cluster'),
    os = require('os'),

    shien = require('shien'),
    when = require('when'),

    variables = require('./variables'),
    config = require('./config'),
    log = require('./log');

function Ken() {
}

Ken.prototype = new function () {

    var slice = Array.prototype.slice;

    function loadConfiguration(opts) {
        /* jshint validthis: true */

        var self = this,
            cfg;

        if (this.master) {
            cfg = config(this.env, variables.CONFIG);
            shien.merge(cfg, opts);
        } else {
            cfg = config('empty');
        }

        return when.resolve(cfg)
            .tap(function configureFullHostname(cfg) {
                if (!cfg.fullHostname) {
                    cfg.fullHostname = 'http://' + cfg.host + ':' + cfg.port;
                }
            })
            .then(function integrateConfiguration(cfg) {
                shien.define(self, 'config', cfg, true);
            });
    }

    function loadCluster() {
        /* jshint validthis: true */

        var self = this;

        // Cluster options

        if (this.master) {
            var c = this.config;

            c.cluster || (c.cluster = {});
            c.cluster.workers || (c.cluster.workers = 1);

            if (c.cluster.workers === 'max') {
                c.cluster.workers = os.cpus().length;
            }

            this.clustered = (c.cluster.workers > 1);

        } else {
            this.clustered = true;
        }

        // Create logger and cluster

        var logger = log(this.master ? undefined : 'delay'),
            cluster = require('./cluster')(this.master, this.clustered);

        if (!this.master) {
            logger.reload(function (level) {
                var args = slice.call(arguments);
                args.shift(); // Remove log level from argument array

                return this.message({
                    action: 'log',
                    level: level,
                    data: args,
                    length: args.length
                });
            }, cluster);
        }

        shien.enhance(this, logger);

        // Initialize cluster

        var initalization = cluster.init();

        // No need to configure for worker running in master process
        if (this.master && cluster.configure) {
            cluster.configure();
        }

        return when.resolve(initalization)
            .then(function integrateCluster() {
                shien.define(self, 'cluster', cluster);
                shien.expose(self, cluster, [
                    // Cluster methods
                    'message',

                    // Event emitter methods
                    'addListener',
                    'on',
                    'once',
                    'removeListener',
                    'removeAllListeners',
                    'setMaxListeners',
                    'listeners',
                    'emit'
                ]);
            });
    }

    function loadApplication() {
        /* jshint validthis: true */

        var self = this,
            app = require('./app')();

        return when.resolve(app.init())
            .then(function integrateApp() {
                shien.define(self, 'app', app);
                shien.expose(self, app, [
                    'server',
                    'rack',
                    'router',
                    'require'
                ]);

                // Tell cluster it's ready to start server
                if (self.cluster.lift) {
                    self.cluster.lift(app.server);
                }
            });
    }

    this.init = function (env, opts) {
        if (typeof env === 'object') {
            opts = env;
            env = null;
        }

        // TODO: Set environment from CLI
        this.env = env || process.env.NODE_ENV || 'development';
        process.env.NODE_ENV = this.env;

        this.master = cluster.isMaster;

        return loadConfiguration.call(this, opts)
            .then(loadCluster.bind(this))
            .then(loadApplication.bind(this))
            .yield(this);
    };

    this.start = function (env, opts) {
        var self = this;

        return this.init(env, opts)
            .then(function initializedSuccessfully() {
                if (!self.master) {
                    return self;
                }

                var starting = self.cluster.start();

                return when.resolve(starting)
                    .yield(self);
            });
    };

};

module.exports = new Ken;
