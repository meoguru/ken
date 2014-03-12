'use strict';

var path = require('path'),
    fs = require('fs'),

    when = require('when'),
    dust = require('dustjs-linkedin'),

    viewRenderer = null;

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

function load(viewsPath, opts) {
    if (viewRenderer) {
        return viewRenderer;
    }

    return (viewRenderer = new ViewRenderer(viewsPath, opts));
}

module.exports = load;
