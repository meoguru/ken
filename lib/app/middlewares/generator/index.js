'use strict';

var path = require('path'),
    fs = require('fs'),

    nodeFn = require('when/node/function'),
    dust = require('dustjs-helpers'),

    variables = require('../../../variables'),

    CONFIG_TEMPLATE = 'config.js.dust',
    ROUTES_TEMPLATE = 'routes.js.dust',
    VIEW_TEMPLATE = 'view.js.dust',
    VIEW_REGEX = /^\/app\/templates\/(.*)\.js$/,

    readFile = nodeFn.lift(fs.readFile.bind(fs)),
    renderSource = nodeFn.lift(dust.renderSource.bind(dust));

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

            '/config/routes.js': function (req, res, next) {
                if (!router) {
                    return next();
                }

                var template = path.join(__dirname, ROUTES_TEMPLATE);

                readFile(template, 'utf8')
                    .then(function (src) {
                        var routes = router.routes.filter(function (route) {
                            return !route.options.noClient;
                        });

                        return renderSource(src, { routes: routes });
                    })
                    .done(
                        function (content) {
                            res.statusCode = 200;
                            res.setHeader('Content-type', 'application/javascript');
                            res.end(content);
                        },
                        function (err) {
                            next(err.code !== 'ENOENT' ? err : undefined);
                        }
                    );
            }
        },

        dispatchTemplate = function (req, res, next) {
            var matched = VIEW_REGEX.exec(req.url);
            if (!matched) {
                return next();
            }

            var template = path.join(__dirname, VIEW_TEMPLATE),
                view = path.join(variables.VIEWS, matched[1]) + '.dust',

                templateSrc,
                viewSrc;

            readFile(view, 'utf8')
                .then(function (src) {
                    viewSrc = src;
                })
                .yield(readFile(template, 'utf8'))
                .then(function (src) {
                    templateSrc = src;
                })
                .then(function () {
                    return renderSource(templateSrc, {
                        code: dust.compile(viewSrc, matched[1])
                    });
                })
                .done(
                    function (content) {
                        res.statusCode = 200;
                        res.setHeader('Content-type', 'application/javascript');
                        res.end(content);
                    },
                    function (err) {
                        next(err.code !== 'ENOENT' ? err : undefined);
                    }
                );
        };

    return function handleRequest(req, res, next) {
        var dispatch = dispatcher[req.url] || dispatchTemplate;
        return dispatch(req, res, next);
    };

};
