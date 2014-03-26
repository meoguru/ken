'use strict';

var shien = require('shien'),
    winston = require('winston'),

    LOG_LEVELS = [
        { level: 'access', color: 'blue' },
        { level: 'debug', color: 'magenta' },
        { level: 'info', color: 'green' },
        { level: 'notice', color: 'cyan' },
        { level: 'warning', color: 'yellow' },
        { level: 'error', color: 'red' },
        { level: 'critical', color: 'red' },
        { level: 'alert', color: 'red' },
        { level: 'emergency', color: 'red' }
    ],

    log = null;

exports = module.exports = function loadLog(fn, that) {
    if (log) {
        if (log.reload) {
            delete log.reload;
        } else {
            return log;
        }

    } else {
        log = {};
    }

    // Delay injecting logging function
    if (fn === 'delay') {
        log.reload = loadLog;
        return log;
    }

    if (!fn) {
        var opts = {
            levels: {},
            colors: {}
        };

        // Initialize Winston's logging options
        LOG_LEVELS.forEach(function iterateLogLevels(v, i) {
            opts.levels[v.level] = i;
            opts.colors[v.level] = v.color;
        });

        var logger = new winston.Logger(opts);
        logger.add(winston.transports.Console, { colorize: true });

        shien.define(log, 'logger', logger);

        // Delegate logging to Winston's logger
        LOG_LEVELS.forEach(function iterateLogLevels(v) {
            log[v.level] = function () {
                logger[v.level].apply(logger, arguments);
            };
        });

        return log;
    }

    if (typeof fn !== 'function') {
        throw new Error('Bad logging function!');
    }

    LOG_LEVELS.forEach(function iterateLogLevels(v) {
        // Create log-level-binded version
        // so don't need to slice argument array later
        var thatFn = fn.bind(that, v.level);

        log[v.level] = function () {
            thatFn.apply(that, arguments);
        };
    });

    return log;
};

exports.logLevels = LOG_LEVELS;
