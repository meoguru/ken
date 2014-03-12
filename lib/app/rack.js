'use strict';

var favicon = require('static-favicon'),
    statik = require('serve-static'),
    less = require('less-middleware'),

    variables = require('../variables'),
    log = require('../log')(),
    cluster = require('../cluster')(),

    viewRenderer = require('./middlewares/view-renderer'),
    router = require('./middlewares/router'),

    ONE_DAY_MS = 24 * 60 * 60 * 1000,
    ONE_YEAR_MS = 365 * ONE_DAY_MS;

module.exports = function () {

    var self = this,
        rack = this.rack,

        env = process.env.NODE_ENV,
        devOrTest = ([ 'development', 'test' ].indexOf(env) >= 0),

        faviconMaxAge = (devOrTest ? 0 : ONE_DAY_MS),
        staticMaxAge = (devOrTest ? 0 : ONE_YEAR_MS);

    /* Favicon */

    rack.use(favicon(variables.FAVICON, { maxAge: faviconMaxAge }));

    /* Static assets */

    if (devOrTest) {
        rack.use('/css', less(variables.CSS, {
            dest: variables.COMPILED_CSS,
            compress: false
        }));

        rack.use('/js', statik(variables.JS, { maxAge: staticMaxAge }));
    }

    rack.use(statik(variables.PUBLIC, { maxAge: staticMaxAge }));

    /* View renderer */

    rack.use(viewRenderer(variables.VIEWS, {
        layoutPath: variables.LAYOUTS,
        layout: variables.BASE_LAYOUT,
        cache: !devOrTest,
        stripWhitespaces: !devOrTest
    }));

    /* Routing */

    rack.use(router(
        this.router,
        function getDispatchers(controller, action) {
            var c = self.controller(controller);
            return (c ? c.dispatch(action) : []);
        }
    ));

    /* Handle uncaught exceptions */

    rack.use(function handleUncaughtExceptions(err, req, res, next) {
        /* jshint unused: false */

        var e = ((err instanceof Error) ? err.stack : err);

        if (cluster.startShutdown) { // master
            log.alert('Critical error occurred in master process!', e);
        } else {
            log.critical('Uncaught error occurred!', e);
        }

        if (devOrTest) {
            process.exit(1);
        } else if (cluster.startShutdown) { // master
            cluster.startShutdown();
        } else {
            cluster.shutDown();
        }
    });

};
