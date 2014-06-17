'use strict';

var path = require('path'),
    cwd = process.cwd();

module.exports = {
    path: {
        ROOT: cwd,

        CONFIG: path.join(cwd, 'config/config'),

        LOGS: path.join(cwd, 'logs'),

        APP: path.join(cwd, 'app'),

        APP_ASSETS: path.join(cwd, 'app/assets'),
        APP_ASSETS_CSS: path.join(cwd, 'app/assets/stylesheets'),
        APP_ASSETS_JS: path.join(cwd, 'app/assets/javascripts'),

        APP_VIEWS: path.join(cwd, 'app/views'),
        APP_HELPERS: path.join(cwd, 'app/helpers'),
        APP_MODELS: path.join(cwd, 'app/models'),
        APP_MODEL_PLUGINS: path.join(cwd, 'app/models/plugins'),
        APP_SERVICES: path.join(cwd, 'app/services'),
        APP_CONTROLLERS: path.join(cwd, 'app/controllers'),
        APP_CONTROLLER_FILTERS: path.join(cwd, 'app/controllers/filters'),
        APP_INITIALIZERS: path.join(cwd, 'app/initializers'),

        PUBLIC: path.join(cwd, 'public'),
        PUBLIC_FAVICON: path.join(cwd, 'public/favicon.ico'),
        PUBLIC_CSS: path.join(cwd, 'public/css'),
        PUBLIC_JS: path.join(cwd, 'public/js'),

        APP_CLIENT_CONFIG: path.join(cwd, 'app/assets/javascripts/config'),
        PUBLIC_CONFIG: path.join(cwd, 'public/js/config'),

        APP_CLIENT_TEMPLATES: path.join(cwd, 'app/assets/javascripts/app/templates'),
        PUBLIC_TEMPLATES: path.join(cwd, 'public/js/app/templates'),
    },
    view: {
        LAYOUTS_DIR: 'layouts', // relative to views path
        BASE_LAYOUT: 'base',
    }
};
