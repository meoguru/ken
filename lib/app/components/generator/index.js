'use strict';

var path = require('path'),
    fs = require('fs'),

    nodeFn = require('when/node'),

    ROUTES_TEMPLATE = path.join(__dirname, 'routes.js.dust'),
    VIEW_TEMPLATE = path.join(__dirname, 'view.js.dust'),

    generator = null;

function Generator(renderer, options) {
    this.renderer = renderer;
    this.viewsPath = renderer.viewsPath;
    this.viewExt = renderer.options.ext;

    options = options || {};
    this.router = options.router;

    this.setup();
}

Generator.prototype = new function () {

    var readFile = nodeFn.lift(fs.readFile);

    function createLiteralFromString(s) {
        return '\'' + s.replace(/[\\']/g, '\\$1') + '\'';
    }

    this.setup = function () {
        this.renderer.filter('l', function literalify(value) {
            if (value instanceof RegExp) {
                return value.toString();
            }

            if (Array.isArray(value)) {
                return '[' + value.map(literalify).join(', ') + ']';
            }

            if (typeof value === 'object') {
                var props = [];

                for (var prop in value) {
                    if (value.hasOwnProperty(prop)) {
                        props.push(createLiteralFromString(prop) + ': ' + literalify(value[prop]));
                    }
                }

                return '{' + props.join(', ') + '}';
            }

            return createLiteralFromString(value.toString());
        });

        delete this.setup;
    };

    this.generateRoutes = function () {
        var routes = this.router.routes.filter(function (route) {
                return !(route.opts && !route.opts.noClient);
            });

        return this.renderer.renderFile(ROUTES_TEMPLATE, { routes: routes });
    };

    this.generateView = function (view) {
        var renderer = this.renderer;

        return readFile(path.join(this.viewsPath, view) + '.' + this.viewExt, 'utf8')
            .then(function compileView(content) {
                return renderer.compile(content, view);
            })
            .then(function generateView(code) {
                return renderer.renderFile(VIEW_TEMPLATE, { code: code });
            });
    };

};

module.exports = function loadGenerator(renderer, options) {
    if (generator) {
        return generator;
    }

    return (generator = new Generator(renderer, options));
};
