'use strict';

var path = require('path'),
    cwd = process.cwd();

module.exports = {
    path: {
        CONFIG: path.join(cwd, 'config/config'),

        ROUTES: path.join(cwd, 'config/routes'),
        CLIENT_ROUTES: path.join(cwd, 'app/assets/javascripts/config/routes.js'),

        PUBLIC: path.join(cwd, 'public'),
        FAVICON: path.join(cwd, 'public/favicon.ico'),

        CSS: path.join(cwd, 'app/assets/stylesheets'),
        COMPILED_CSS: path.join(cwd, 'public/css'),

        JS: path.join(cwd, 'app/assets/javascripts'),
        COMPILED_JS: path.join(cwd, 'public/js'),

        PUBLIC_IMAGES: path.join(cwd, 'public/img'),
        PUBLIC_FONTS: path.join(cwd, 'public/font'),
        PUBLIC_UPLOAD: path.join(cwd, 'public/upload'),

        HELPERS: path.join(cwd, 'app/helpers'),
        INITIALIZERS: path.join(cwd, 'app/initializers'),

        MODELS: path.join(cwd, 'app/models'),
        MODEL_PLUGINS: path.join(cwd, 'app/models/plugins'),

        VIEWS: path.join(cwd, 'app/views'),
        CLIENT_VIEWS: path.join(cwd, 'app/assets/javascripts/app/templates'),

        SERVICES: path.join(cwd, 'app/services'),
        CONTROLLERS: path.join(cwd, 'app/controllers')
    },
    view: {
        LAYOUTS_DIR: 'layouts', // relative to views path
        BASE_LAYOUT: 'base',
    }
};
