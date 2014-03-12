'use strict';

function WorkerData(worker) {
    this.worker = worker;
    this.started = false;
    this.heartbeatAt = null;
    this.retireAt = null;
    this.retired = false;
    this.killed = false;
}

exports.WorkerData = WorkerData;
