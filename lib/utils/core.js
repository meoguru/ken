'use strict';

var path = require('path'),
    fs = require('fs'),

    _ = require('lodash'),

    fileUtils = require('./file');

module.exports = new function () {

    var defineProperty = Object.defineProperty;

    this.load = function (p, multi) {
        try {
            var main = require(p);
            return (multi ? [ main ] : main);

        } catch (err) {
            if (err.code !== 'MODULE_NOT_FOUND') {
                throw err;
            }

            if (!multi) {
                return;
            }

            if (fs.existsSync(p)) {
                var files = fileUtils.traverseSync(p, {
                    match: fileUtils.regexs.JS
                });

                files.sort();

                return files.map(function (file) {
                    return require(
                        path.join(p, file)
                    );
                });
            }

            return [];
        }
    };

    this.implement = function(m, p) {
        var self = this,
            suffixes = [ '-impl' ];

        p = p.replace(fileUtils.regexs.JS, '');

        if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
            suffixes.push(
                path.sep + 'index-impl'
            );
        }

        suffixes.forEach(function (s) {
            var fns = self.load(p + s, true);

            fns.forEach(function (fn) {
                if (typeof fn === 'function') {
                    fn.call(m, m);
                }
            });
        });

        return m;
    };

    this.expose = function (dest, src, props, opts) {
        var o = opts || {};

        if (!Array.isArray(props)) {
            props = [ props ];
        }

        props.forEach(function iterateProperties(prop) {
            if (!_.isString(prop)) {
                return;
            }

            var v = src[prop];

            if (o.link) {
                defineProperty(dest, prop, {
                    configurable: true,
                    enumerable: true,
                    get: function getValue() {
                        return src[prop];
                    },
                    set: function setValue(v) {
                        return (src[prop] = v);
                    }
                });

            } else {
                if (o.keepBinding && typeof v === 'function') {
                    v = v.bind(src);
                }

                dest[prop] = v;
            }
        });
    };

    this.callbackify = function (cb) {
        return function () {
            if (typeof cb === 'function') {
                cb.apply(null, arguments);
            }
        };
    };

};
