'use strict';

var shien = require('shien'),
    when = require('when'),

    cookie = require('cookie'),
    cookieSignature = require('cookie-signature'),
    cookieParser = require('cookie-parser');

module.exports = function (secret) {

    var middleware = cookieParser(secret);

    return function (context) {
        var deferred = when.defer(),

            req = context.req,
            res = context.res;

        middleware(req, res, function (err) {
            if (err) {
                return deferred.resolve(
                    context.next(err)
                );
            }

            res.clearCookie = function (name, options) {
                var opts = shien.assign({
                        expires: new Date(1),
                        path: '/'
                    }, options);

                return this.cookie(name, '', opts);
            };

            res.cookie = function (name, value, options) {
                var opts = shien.assign({}, options),
                    secret = req.secret,
                    signed = options.signed;

                if (signed && !secret) {
                    throw new Error('Secret is required for signed cookies!');
                }

                if (typeof value === 'number') {
                    value = value.toString();

                } else if (typeof value === 'object') {
                    value = 'j:' + JSON.stringify(value);
                }

                if (signed) {
                    value = 's:' + cookieSignature.sign(value, secret);
                }

                if ('maxAge' in opts) {
                    opts.expires = new Date(Date.now() + opts.maxAge);
                    opts.maxAge /= 1000;
                }

                if (!opts.path) {
                    opts.path = '/';
                }

                var header = cookie.serialize(name, String(value), opts),
                    prev = this.getHeader('Set-Cookie');

                if (prev) {
                    if (Array.isArray(prev)) {
                        header = prev.concat(header);
                    } else {
                        header = [ prev, header ];
                    }
                }

                this.setHeader('Set-Cookie', header);

                return this;
            };

            deferred.resolve(context.next);
        });

        return deferred.promise;
    };

};
