'use strict';

var path = require('path'),

    _ = require('lodash'),
    express = require('express'),

    ken = require('../ken'),
    pathConsts = ken.consts.path,
    utils = ken.utils,

    config = require('../config');

ken.express = express;

function create() {
    var db = require('../db'),
        controller = require('./controller');

    var app = express();

    app.disable('x-powered-by');

    app.set('views', pathConsts.APP_VIEWS);
    app.set('view cache', (ken.env !== config.envs.DEV));

    if (ken.isDevEnv) {
        app.set('json spaces', 4);
    }

    app.routes = {};

    app.setup = function (cb) {
        var initializers = ken.utils.load(
            pathConsts.APP_INITIALIZERS,
            true
        );

        initializers.forEach(function (initializer) {
            if (typeof initializer === 'function') {
                initializer();
            }
        });

        utils.callbackify(cb)();
    };

    app.registry = [];
    app.modules = {};

    var forbiddenFns = [
        path.relative(pathConsts.APP, pathConsts.APP_ASSETS),
        path.relative(pathConsts.APP, pathConsts.APP_INITIALIZERS),
        path.relative(pathConsts.APP, pathConsts.APP_VIEWS)
    ];

    app.register = function (fn, dir, conv) {
        if (app[fn] || forbiddenFns.indexOf(fn) >= 0) {
            throw new Error('Conflicted method name `' + fn + '`!');
        }

        app[fn] = function (p) {
            var fp = path.join(pathConsts.APP, dir, p);

            if (fp in app.modules) {
                return app.modules[fp];
            }

            var m = utils.load(fp);

            if (typeof conv === 'function') {
                m = conv(m, fp);
            }

            if (!(_.isObject(m) && m.__proto__ === ken.mongoose.Model)) {
                utils.implement(m, fp);
            }

            return (app.modules[fp] = m);
        };

        app.registry.push(fn);
    };

    function register(ns, p, fn) {
        return app.register(ns, path.relative(
            pathConsts.APP,
            p
        ), fn);
    }

    register('helper', pathConsts.APP_HELPERS);
    register('model', pathConsts.APP_MODELS, db.modelize);
    register('modelPlugin', pathConsts.APP_MODEL_PLUGINS);
    register('service', pathConsts.APP_SERVICES);
    register('controller', pathConsts.APP_CONTROLLERS, controller.setup);
    register('controllerFilter', pathConsts.APP_CONTROLLER_FILTERS);

    return app;
}

exports.setup = function (cb) {
    var app = create();

    utils.expose(ken, app, 'register', { keepBinding: true });
    utils.expose(ken, app, app.registry, { keepBinding: true });

    ken.app = app;

    var router = require('./router'),
        response = require('./response');

    router.setup();
    response.setup();

    app.setup(cb);
};
