'use strict';

var shien = require('shien'),
    Router = require('michi').Router,

    router = null;

function load(path) {
    if (router) {
        return router;
    }

    router = new Router;

    var match = router.match;

    router.match = function (uri) {
        if (uri.charAt(uri.length - 1) !== '/') {
            uri = uri + '.:format?';
        }
        return match.apply(router, arguments);
    };

    if (path) {
        var modules = shien.load(path, { multi: true });

        modules.forEach(function iterateModules(module) {
            if (typeof module === 'function') {
                module.call(router);
            }
        });
    }

    return router;
}

module.exports = load;
