'use strict';

var path = require('path'),
    fs = require('fs'),

    dust = require('dustjs-helpers'),

    CONFIG_TEMPLATE = 'config.js.dust',
    ROUTER_TEMPLATE = 'router.js.dust';

module.exports = function (dest, opts) {

    var o = opts || {},
        config = o.config,
        router = o.router,

        dispatcher = {
            '/config/config.js': function (req, res, next) {
                if (!config) {
                    return next();
                }
            },

            '/config/router.js': function (req, res, next) {
                if (!router) {
                    return next();
                }

                var file = path.join(__dirname, ROUTER_TEMPLATE);

                fs.readFile(file, 'utf8', function (err, src) {
                    if (err) {
                        return next(err.code !== 'ENOENT' ? err : undefined);
                    }

                    var routes = router.routes.map(function (route) {
                            if (route.options.noClient) {
                                return;
                            }

                            var regex = route.pattern()
                                    .toString()
                                    .replace(/^(\/\^)(?:\\\/)?/, '$1');

                            return {
                                regex: regex,
                                controller: route.controller,
                                action: route.action
                            };
                        })
                        .filter(function (route) {
                            return route;
                        });

                    dust.renderSource(src, { routes: routes }, function (err, content) {
                        if (err) {
                            return next(err);
                        }

                        res.statusCode = 200;
                        res.setHeader('Content-type', 'application/json');
                        res.end(content);
                    });
                });
            }
        };

    return function handleRequest(req, res, next) {
        var dispatch = dispatcher[req.url];

        if (typeof dispatch === 'function') {
            return dispatch(req, res, next);
        }

        return next();
    };

};
