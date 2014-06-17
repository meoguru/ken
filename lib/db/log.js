'use strict';

var util = require('util'),

    ken = require('../ken'),
    utils = require('../../node_modules/mongoose/lib/utils');

var log = exports;

log.format = function (obj, sub) {
    if (typeof obj === 'function' || typeof obj === 'undefined') {
        return '';
    }

    var x = utils.clone(obj);

    if (x) {
        if ('Binary' === x.constructor.name) {
            x = '[object Buffer]';

        } else if ('ObjectID' === x.constructor.name) {
            var representation = 'ObjectId(\'' + x.toHexString() + '\')';
            x = { inspect: function () { return representation; } };

        } else if ('Date' === x.constructor.name) {
            var representation = 'new Date(\'' + x.toUTCString() + '\')';
            x = { inspect: function () { return representation; } };

        } else if ('Object' === x.constructor.name) {
            var keys = Object.keys(x),
                i = keys.length,
                key;

            while (i--) {
                key = keys[i];

                if (x[key]) {
                    if (Array.isArray(x[key])) {
                        x[key] = x[key].map(function (item) {
                            return log.format(item, true)
                        });

                    } else {
                        var v = log.format(x[key], true);
                        if (typeof v !== 'undefined') {
                            x[key] = v;
                        }
                    }
                }
            }

        } else if (sub) {
            return;
        }

        if (sub) {
            return x;
        }
    }

    return util.inspect(x, false, 10, true)
        .replace(/\n/g, '')
        .replace(/\s{2,}/g, ' ');
};

log.method = function (collection, method, query, opts) {
    ken.debug(
        'Called \x1b[33m%s.%s\x1b[0m with query = %s, options = %s',
        collection,
        method,
        log.format(query),
        log.format(opts)
    );
};
