'use strict';

var path = require('path'),
    fs = require('fs'),

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
                    return require(path.join(p, file));
                });
            }

            return [];
        }
    };

    this.expose = function (dest, src, props, opts) {
        var o = opts || {};

        if (!Array.isArray(props)) {
            props = [ props ];
        }

        props.forEach(function iterateProperties(prop) {
            if (typeof prop !== 'string') {
                return;
            }

            var v = src[prop];

            if (typeof v !== 'undefined') {
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
