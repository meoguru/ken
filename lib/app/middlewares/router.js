'use strict';

var shien = require('shien'),
    when = require('when'),

    Response = require('../exchange/response').Response;

module.exports = function (router, getDispatchers) {

    function dispatchRequest(req, dispatchers, index) {
        if (index >= dispatchers.length) {
            return req.bypass;
        }

        var resPromise = dispatchers[index](req);

        when.resolve(resPromise)
            .then(function handleDispatcherResponse(res) {
                if (res === req.next) {
                    return dispatchRequest(req, dispatchers, index + 1);

                } else if (res === req.bypass) {
                    return res;

                } else if (res instanceof Response) {
                    req.emit('response', res);
                }
            });
    }

    return function handleRequest(originalRequest, originalResponse, next) {
        var req = originalRequest.modifiedRequest;

        (function routeRequest(index) {
            var matched = router.next(originalRequest.path, req.method, index);
            if (!matched) {
                return next();
            }

            shien.expose(req, matched, [ 'controller', 'action', 'params' ]);

            var dispatchers = getDispatchers(matched.controller, matched.action),
                resPromise = dispatchRequest(req, dispatchers, 0);

            when.resolve(resPromise)
                .then(function handleRouteResponse(res) {
                    if (res === req.bypass) {
                        return routeRequest(matched.next);

                    } else if (res instanceof Response) {
                        req.emit('response', res);
                    }
                });
        })(0);
    };

};
