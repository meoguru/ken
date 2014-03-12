'use strict';

exports.dispatch = function (worker) {

    worker.on('config', function handleConfigurationEvent(msg) {
        this.configure(msg.data);
    });

    worker.on('start', function handleStartEvent() {
        this.start()
            .done();
    });

    worker.on('retire', function handleRetirementEvent() {
        this.retire()
            .done();
    });

    worker.on('shutdown', function handleShutdownEvent() {
        this.shutDown()
            .done();
    });

};
