'use strict';

var _ = require('lodash'),
    winston = require('winston'),
    common = require('../node_modules/winston/lib/winston/common'),

    ken = require('./ken');

var logLevels = exports.logLevels = [
    { level: 'access', color: 'blue' },
    { level: 'debug', color: 'magenta' },
    { level: 'info', color: 'green' },
    { level: 'notice', color: 'cyan' },
    { level: 'warning', color: 'yellow' },
    { level: 'error', color: 'red' },
    { level: 'critical', color: 'red' },
    { level: 'alert', color: 'red' },
    { level: 'emergency', color: 'red' }
];

function create() {
    var logConfig = ken.config.log,

        opts = { levels: {}, colors: {} },
        log = {};

    // Initialize Winston's logging options
    logLevels.forEach(function (v, i) {
        opts.levels[v.level] = i;
        opts.colors[v.level] = v.color;
    });

    var logger = new winston.Logger(opts);

    if (!ken.options.silent) {
        logger.add(winston.transports.Console, {
            level: logConfig.consoleLevel,
            colorize: true
        });
    }

    logger.add(winston.transports.DailyRotateFile, {
        level: logConfig.fileLevel,
        filename: logConfig.filePrefix,
        dirname: ken.consts.path.LOGS,
        json: false
    });

    log.logger = logger;

    // Delegate logging to Winston's logger
    logLevels.forEach(function (v) {
        log[v.level] = function () {
            logger[v.level].apply(logger, arguments);
        };
    });

    return log;
}

exports.setup = function () {
    var log = common.log;

    common.log = function (options) {
        if (!options.colorize) {
            options.message = options.message.replace(/\[\d+m/g, '');
        }
        return log.apply(this, arguments);
    };

    _.assign(ken, create());
};
