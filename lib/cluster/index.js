'use strict';

var cluster = null;

function load(master, clustered) {
    if (cluster) {
        return cluster;
    }

    if (master && clustered) {
        cluster = require('./master')();
    } else {
        cluster = require('./worker')(clustered);
    }

    return cluster;
}

module.exports = load;
