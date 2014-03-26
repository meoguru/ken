'use strict';

exports.WorkerData = function (worker) {
    this.worker = worker;
    this.started = false;
    this.heartbeatAt = null;
    this.retireAt = null;
    this.retired = false;
    this.killed = false;
};
