'use strict';

var path = require('path'),
    fs = require('fs'),

    inflection = require('inflection'),
    shien = require('shien'),
    when = require('when'),
    dust = require('dustjs-helpers');

function ViewRenderer(viewsPath, opts) {
    var self = this;

    this.viewsPath = viewsPath;
    this.options = opts || {};

    if (typeof this.options.ext !== 'string') {
        this.options.ext = 'dust';
    }

    if (!this.options.cache) {
        var load = dust.load;

        dust.load = function (name) {
            delete dust.cache[name];
            return load.apply(dust, arguments);
        };
    }

    if (!this.options.stripWhitespaces) {
        dust.optimizers.format = function (ctx, node) {
            return node;
        };
    }

    dust.onLoad = function (name, cb) {
        var file = path.join(self.viewsPath, name + '.' + self.options.ext);
        fs.readFile(file, 'utf8', cb);
    };
}

ViewRenderer.prototype = new function () {

    this.render = function (name, val) {
        return when.promise(function renderView(resolve, reject) {
            dust.render(name, val, function renderingCompleted(err, data) {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    };

    this.renderWithLayout = function (layout, name, val) {
        if (typeof val.view !== 'undefined') {
            throw new Error('`view` is a reserved keyword, cannot be used in response!');
        }

        val.view = name;

        return this.render(layout, val);
    };

};

function middleware(viewsPath, opts) {

    var o = opts || {},
        viewRenderer = new ViewRenderer(viewsPath, o);

    return function handleRequest(originalRequest, originalResponse, next) {
        var req = originalRequest.modifiedRequest;

        req.on('response', function (res) {
            var layout = (res.layout !== false ? (res.layout || o.layout) : false),
                view = res.view,

                val = {},
                ret;

            shien.assign(val, req);
            shien.merge(val, o.global, res.value);

            if (!view) {
                view = inflection.transform(req.controller, [ 'underscore', 'dasherize' ]) + '/' +
                        inflection.transform(req.action, [ 'underscore', 'dasherize' ]);
            }

            if (layout) {
                layout = (o.layoutPath ? o.layoutPath + '/' : '') + layout;
                ret = viewRenderer.renderWithLayout(layout, view, val);

            } else {
                ret = viewRenderer.render(view, val);
            }

            when.resolve(ret)
                .then(function renderedSuccessfully(data) {
                    originalResponse.end(data);
                })
                .done();
        });

        next();
    };

};

module.exports = middleware;
