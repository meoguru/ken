'use strict';

var log = require('../../log')();

exports.dispatch = function (master) {

    var slice = Array.prototype.slice;

    master.on('readyForRetirement', function handleRetirementEvent(msg) {
        this.killWorker(msg.pid);
    });

    master.on('readyForShutdown', function handleShutdownEvent(msg) {
        log.notice('Killing worker for graceful shutdown.', { pid: msg.pid });
        this.killWorker(msg.pid);
    });

    master.on('log', function handleLogEvent(msg) {
        msg.data.length = msg.length;

        var args = slice.call(msg.data);
        args.push({ pid: msg.pid });

        log[msg.level].apply(log, args);
    });

    master.on('heartbeat', function handleHeartbeatEvent(msg) {
        var workerData = this.workers.get(msg.pid);
        if (workerData) {
            workerData.heartbeatAt = Date.now();
        }
    });

};
