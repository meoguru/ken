'use strict';

var methods = require('methods'),
    qs = require('qs'),

    express = require('express'),

    Router = express.Router,
    routerProto = Router,

    Route = express.Route,
    routeProto = Route.prototype,

    ken = require('../ken'),
    app = ken.app;

var slice = Array.prototype.slice;

exports.setup = function () {
    var useFn = routerProto.use,
        routeFn = routerProto.route;

    routerProto.use = function (p) {
        var len = arguments.length,
            fn = (len ? arguments[len - 1] : null);

        if (fn && fn.__proto__ === routerProto) {
            if (typeof p !== 'string') {
                p = '/';
            }

            fn.router = this;
            fn.path = p;
        }

        return useFn.apply(this, arguments);
    };

    routerProto.route = function (p) {
        var route = routeFn.apply(this, arguments);
        route.router = this;
        return route;
    };

    methods.concat('all').forEach(function (method) {
        var fn = routeProto[method];

        routeProto[method] = function () {
            var args = slice.call(arguments),
                routeName = null;

            if (args.length && typeof args[0] === 'string' &&
                args[0].indexOf('>') < 0) {

                routeName = args.shift();

                if (app.routes[routeName]) {
                    throw new Error('Conflicted route name `' + routeName + '`!');
                }

                app.routes[routeName] = this;
            }

            args = args.map(function (arg) {
                if (typeof arg === 'string') {
                    var parts = arg.split(/\s*>\s*/);

                    if (parts.length !== 2) {
                        throw new Error('Bad controller action `' + arg + '`!');
                    }

                    var controller = parts[0],
                        action = parts[1];

                    return function (req, res, next) {
                        var handle = app.controller(controller)
                                .handle(action);

                        req.controller = controller;
                        req.action = action;
                        req.route = routeName;

                        res.push('controller', controller);
                        res.push('action', action);
                        res.push('route', routeName);

                        handle(req, res, function (err) {
                            delete req.controller;
                            delete req.action;

                            next(err);
                        });
                    };
                }

                return arg;
            });

            return fn.apply(this, args);
        };
    });

    app.url = function (routeName, params, inclQuery) {
        params = params || {};

        if (typeof inclQuery === 'undefined') {
            inclQuery = true;
        }

        var route = app.routes[routeName];

        if (route.__proto__ === routeProto) {
            var routePath = '',
                node = route;

            while (node.router) {
                routePath = (node.path ? node.path : '') + routePath;
                node = node.router;
            }

            route = app.routes[routeName] = routePath;
        }

        var used = {},
            ret = route.replace(/(\/:\w+\??)/g, function (m, p) {
                p = p.replace(/[/:?]/g, '');
                used[p] = true;
                return (params[p] ? '/' + params[p] : '');
            });

        if (!inclQuery) {
            return ret;
        }

        for (var prop in used) {
            delete params[prop];
        }

        var query = qs.stringify(params);

        return (ret + (query ? '?' + query : ''));
    };
};
