'use strict';

var cluster = null;

module.exports = function loadCluster(master, clustered) {
    if (cluster) {
        return cluster;
    }

    if (master && clustered) {
        cluster = require('./master')();
    } else {
        cluster = require('./worker')(clustered);
    }

    return cluster;
};
