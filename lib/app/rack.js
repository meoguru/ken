'use strict';

var path = require('path'),

    favicon = require('static-favicon'),
    statik = require('serve-static'),
    less = require('less-middleware'),
    cookie = require('cookie-parser'),
    session = require('express-session'),
    RedisStore = require('connect-redis')(session),
    flash = require('connect-flash'),

    variables = require('../variables'),
    paths = variables.path,

    config = require('../config')(),
    log = require('../log')(),
    db = require('../db')(),

    query = require('./middlewares/query'),
    body = require('./middlewares/body'),
    userAgent = require('./middlewares/user-agent'),
    router = require('./middlewares/router'),
    generator = require('./middlewares/generator'),

    ONE_DAY_MS = 24 * 60 * 60 * 1000,
    ONE_YEAR_MS = 365 * ONE_DAY_MS;

exports.initialize = function (app) {
    var rack = app.rack,
        soketto = app.soketto,
        passport = app.passport,

        devOrTest = app.devOrTest,

        faviconMaxAge = (devOrTest ? 0 : ONE_DAY_MS),
        staticMaxAge = (devOrTest ? 0 : ONE_YEAR_MS);

    /* Favicon */

    rack.use(favicon(paths.FAVICON, { maxAge: faviconMaxAge }), { connect: true });

    /* Static assets */

    if (devOrTest) {
        // Stylesheets
        rack.use('/css', less(paths.CSS, {
            dest: paths.COMPILED_CSS,
            compress: false
        }), { connect: true });

        // Generator
        var routesPath = '/js/' + path.relative(paths.JS, paths.CLIENT_ROUTES),
            viewsPath = '/js/' + path.relative(paths.JS, paths.CLIENT_VIEWS);

        routesPath = routesPath.replace(path.sep, '/');
        viewsPath = viewsPath.replace(path.sep, '/');

        rack.use(routesPath, generator.routes(app.generator));
        rack.use(viewsPath, generator.view(app.generator));

        // JavaScript
        rack.use('/js', statik(paths.JS, { maxAge: staticMaxAge }), { connect: true });
    }

    // TODO: Remove static assets serving in production
    rack.use('/css', statik(paths.COMPILED_CSS, { maxAge: staticMaxAge }), { connect: true });
    rack.use('/js', statik(paths.COMPILED_JS, { maxAge: staticMaxAge }), { connect: true });
    rack.use('/img', statik(paths.PUBLIC_IMAGES, { maxAge: staticMaxAge }), { connect: true });
    rack.use('/font', statik(paths.PUBLIC_FONTS, { maxAge: staticMaxAge }), { connect: true });
    rack.use('/upload', statik(paths.PUBLIC_UPLOAD, { maxAge: staticMaxAge }), { connect: true });

    /* Request parser */

    rack.use(query());
    rack.use(body());
    rack.use(userAgent());

    /* Cookie and session */

    var sessionStore = new RedisStore({
        client: db.redisClient,
        prefix: config.session.redisPrefix
    });

    rack.use(cookie(config.cookie.secret), { connect: true });

    rack.use(session({
        store: sessionStore,
        key: config.session.key,
        secret: config.session.secret,
        cookie: { maxAge: config.session.maxAge }
    }), { connect: true });

    rack.use(flash(), { connect: true });

    /* Passport */

    rack.use(passport.initialize(), { connect: true });
    rack.use(passport.session(), { connect: true });

    /* Soketto */

    soketto.configure(config, {
        sessionStore: sessionStore
    });
    soketto.initialize(app.server);
};

exports.finalize = function (app) {
    var rack = app.rack;

    /* Router */

    rack.use(router(app.router, function getDispatchers(controller, action) {
        var c = app.controller(controller);
        return (c ? c.dispatch(action) : null);
    }));

    /* Error handling */

    rack.use(function (context) {
        context.res.statusCode = 404;
        context.res.end();
    });

    rack.use(function (context) {
        var err = (context.error instanceof Error ?
                context.error.stack : context.error)

        log.error(err);

        context.res.statusCode = 500;
        context.res.end(err, function () {
            process.exit(1);
        });
    }, { catch: true });
};
