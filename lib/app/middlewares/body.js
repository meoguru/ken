'use strict';

var when = require('when'),
    body = require('body-parser');

module.exports = function () {

    var middleware = body();

    return function (context) {
        var deferred = when.defer();

        middleware(context.req, context.res, function (err) {
            if (err) {
                return deferred.resolve(
                    context.next(err)
                );
            }

            Object.defineProperty(context, 'body', {
                get: function () {
                    return this.req.body;
                },
                set: function (value) {
                    return (this.req.body = value);
                }
            });

            deferred.resolve(context.next);
        });

        return deferred.promise;
    };

};
