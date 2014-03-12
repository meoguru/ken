'use strict';

var util = require('util'),
    EventEmitter = require('events').EventEmitter,

    shien = require('shien'),
    when = require('when'),

    config = require('../../config')(),
    dispatcher = require('./dispatcher'),

    worker = null;

function Worker(clustered) {
    this.clustered = !!clustered;

    // Add default dispatching behavior
    dispatcher.dispatch(this);

    this.initialized = false;

    var self = this;

    this.lifting = when.defer();
    this.lifted = this.lifting.promise
        .then(function liftedSuccessfully(server) {
            self.server = server;
        });
}

util.inherits(Worker, EventEmitter);

shien.assign(Worker.prototype, new function () {

    this.init = function () {
        if (this.initialized) {
            return this.initialized;
        }

        var deferred = when.defer();

        this.postConfigure = function () {
            deferred.resolve(this);
        };

        initWorkerListener.call(this);

        return (this.initialized = deferred.promise);
    };

    function initWorkerListener() {
        /* jshint validthis: true */

        var self = this;

        process.on('message', function handleMessageEvent(msg) {
            receiveMessage.call(self, msg);
        });
    }

    this.lift = function (server) {
        this.lifting.resolve(server);
    };

    this.start = function () {
        var self = this,
            deferred = when.defer();

        return when.join(
                this.init(),
                this.lifted
            )
            .then(function initializedSuccessfully() {
                self.server.listen(config.port, function listeningCompleted(err) {
                    if (err) {
                        return deferred.reject(err);
                    }

                    if (self.clustered) {
                        startHeartbeat.call(self);
                    }

                    var log = require('../../log')();
                    log.info('Listening on %s...', config.fullHostname);

                    deferred.resolve(self);
                });

                return deferred.promise;
            });
    };

    this.configure = function (cfg) {
        shien.merge(config, cfg);
        this.postConfigure();
    };

    this.message = function (msg) {
        // Add process ID for each sent message
        if (typeof msg === 'object') {
            msg.pid = process.pid.toString();
        }
        process.send(msg);
    };

    function receiveMessage(msg) {
        /* jshint validthis: true */

        if (typeof msg !== 'object' || !msg.action) {
            return;
        }

        this.emit(msg.action, msg);
    }

    this.retire = function () {
        var self = this;

        return shutDownCleanly.call(this, config.cluster.rotationTimeout)
            .then(function shutDownSuccessfully() {
                self.message({
                    action: 'readyForRetirement'
                });
            });
    };

    this.shutDown = function () {
        var self = this;

        return shutDownCleanly.call(this, config.cluster.gracefulShutdownTimeout)
            .then(function shutDownSuccessfully() {
                self.message({
                    action: 'readyForShutdown'
                });
            });
    };

    function shutDownCleanly(timeout) {
        /* jshint validthis: true */

        var self = this,
            deadline = Date.now() + timeout,
            deferred = when.defer();

        this.server.on('close', function listenToServerClosing() {
            closeInflightEntries.call(self, deadline, deferred.resolve);
        });

        try {
            this.server.close();
        }
        catch (e) {
        }

        return deferred.promise;
    }

    function closeInflightEntries(deadline, resolve) {
        /* jshint validthis: true */

        var self = this,
            inflight = this.server.inflight,
            ready = true;

        if (inflight && inflight.length) {
            ready = (Date.now() > deadline); // has timed out
            if (ready) {
                inflight.each(function iterateInflightEntries(entry) {
                    entry.terminate();
                });
            }
        }

        if (ready) {
            resolve();

        } else {
            // Poll to see until all in-flight requests complete or
            // we pass the timeout
            setTimeout(function checkInflightEntries() {
                closeInflightEntries.call(self, deadline, resolve);
            }, 2000);
        }
    }

    function startHeartbeat() {
        /* jshint validthis: true */

        var self = this;

        setInterval(function sendHeartbeat() {
            self.message({
                action: 'heartbeat'
            });
        }, config.cluster.heartbeatInterval);
    }

});

function load(clustered) {
    if (worker) {
        return worker;
    }

    return (worker = new Worker(clustered));
}

module.exports = load;
