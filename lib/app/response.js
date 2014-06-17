'use strict';

var express = require('express'),
    resProto = express.response;

exports.setup = function () {
    resProto.cache = function (time, opts) {
        var o = opts || {},
            h;

        if (time <= 0) {
            h = 'no-cache';
        } else {
            h = 'max-age=' + time + ', must-revalidate';
        }

        if ([ 'public', 'private' ].indexOf(o.privacy) >= 0) {
            h = o.privacy + ', ' + h;
        }

        this.header('Cache-Control', h);
    };

    resProto.push = function (name, obj) {
        if (!this.locals) {
            this.locals = {};
        }

        this.locals[name] = obj;
    };
};
