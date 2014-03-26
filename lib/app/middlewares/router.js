'use strict';

var shien = require('shien'),
    when = require('when'),

    BYPASS = shien.string.random();

module.exports = function (router, getDispatchers) {

    function dispatchRequest(context, dispatchers, index) {
        if (index >= dispatchers.length) {
            return context.bypass;
        }

        var promise = dispatchers[index](context);

        when.resolve(promise)
            .then(function handleDispatcherResponse(res) {
                if (res === context.next) {
                    return dispatchRequest(context, dispatchers, index + 1);

                } else if (res === context.bypass) {
                    return res;
                }
            });
    }

    return function (context) {
        context.bypass = BYPASS;

        return (function routeRequest(index) {
            var matched = router.next(context.path, context.method, index);

            if (!matched) {
                return context.next;
            }

            shien.expose(context, matched, [ 'controller', 'action', 'params' ]);

            var dispatchers = getDispatchers(matched.controller, matched.action),
                promise = dispatchRequest(context, dispatchers, 0);

            return when.resolve(promise)
                .then(function handleRouteResponse(res) {
                    if (res === context.bypass) {
                        return routeRequest(matched.next);
                    }
                });
        })(0);
    };

};
