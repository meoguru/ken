'use strict';

var shien = require('shien'),
    Router = require('michi').Router,

    router = null;

module.exports = function loadRouter(routerPath) {
    if (router) {
        return router;
    }

    router = new Router;

    var match = router.match;

    router.match = function (uri) {
        if (uri.charAt(uri.length - 1) !== '/') {
            arguments[0] = uri + '.:format?';
        }
        return match.apply(router, arguments);
    };

    if (routerPath) {
        var modules = shien.load(routerPath, { multi: true });

        modules.forEach(function iterateModules(module) {
            if (typeof module === 'function') {
                module.call(router);
            }
        });
    }

    return router;
};
