'use strict';

var path = require('path'),
    cwd = process.cwd();

module.exports = {
    CONFIG: path.join(cwd, 'config/config'),
    ROUTES: path.join(cwd, 'config/routes'),

    PUBLIC: path.join(cwd, 'public'),
    FAVICON: path.join(cwd, 'public/favicon.ico'),

    CSS: path.join(cwd, 'app/assets/stylesheets'),
    COMPILED_CSS: path.join(cwd, 'public/css'),

    JS: path.join(cwd, 'app/assets/javascripts'),
    COMPILED_JS: path.join(cwd, 'public/js'),

    VIEWS: path.join(cwd, 'app/views'),
    LAYOUTS: 'layouts',
    BASE_LAYOUT: 'base',

    CONTROLLERS: path.join(cwd, 'app/controllers')
};
