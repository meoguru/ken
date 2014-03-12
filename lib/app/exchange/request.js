'use strict';

var util = require('util'),
    EventEmitter = require('events').EventEmitter,

    shien = require('shien'),

    Response = require('./response').Response,

    EXPOSING_REQUEST_INFO = [
        'httpVersion',
        'method',
        'url',
        'path',
        'headers',
        'statusCode'
    ],

    NEXT = shien.string.random(),
    BYPASS = shien.string.random();

function Request(req, res) {
    shien.define(this, 'originalRequest', req);
    shien.define(this, 'originalResponse', res);
    shien.expose(this, req, EXPOSING_REQUEST_INFO, { link: true });

    shien.define(this, 'next', NEXT);
    shien.define(this, 'bypass', BYPASS);
}

util.inherits(Request, EventEmitter);

shien.assign(Request.prototype, new function () {

    this.respond = function (statusCode, val, opts) {
        if (typeof statusCode !== 'number') {
            opts = val;
            val = statusCode;
            statusCode = 200;
        }

        this.statusCode = statusCode;

        var o = opts || {},
            res = new Response(val);

        if (typeof o.value !== 'undefined') {
            delete o.value;
        }

        shien.merge(res, o);

        return res;
    };

    this.throw = function (statusCode, err, opts) {
        if (typeof statusCode !== 'number') {
            opts = err;
            err = statusCode;
            statusCode = 500;
        }

        if (typeof err !== 'string' && !(err instanceof Error)) {
            opts = err;
            err = 'Hello world!'; // TODO: Get error message by status code
        }

        // TODO: Get default controller and action for status code
    };

    this.redirect = function () {};

    this.terminate = function () {};

});

exports.Request = Request;
