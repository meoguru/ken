'use strict';

var path = require('path'),
    fs = require('fs'),

    when = require('when'),
    nodeFn = require('when/node'),

    dust = require('dustjs-helpers'),

    context = require('./context'),
    response = require('./response'),

    renderer = null;

function Renderer(viewsPath, options) {
    this.viewsPath = viewsPath;
    this.options = options || {};

    // Template extension
    if (typeof this.options.ext !== 'string') {
        this.options.ext = 'dust';
    }

    this.setup();
}

Renderer.prototype = new function () {

    var readFile = nodeFn.lift(fs.readFile);

    function setupDust() {
        /* jshint validthis: true */

        var self = this;

        // Template loader
        dust.onLoad = function (name, cb) {
            var file = path.join(self.viewsPath, name + '.' + self.options.ext);
            // TODO: Ignore `template not found` error and display warning
            fs.readFile(file, 'utf8', cb);
        };

        // Template caching
        if (!this.options.cache) {
            var load = dust.load;

            dust.load = function (name) {
                delete dust.cache[name];
                return load.apply(dust, arguments);
            };
        }

        // Writespace stripping
        if (!this.options.stripWhitespaces) {
            dust.optimizers.format = function (ctx, node) {
                return node;
            };
        }
    }

    function setupKasane() {
        /* jshint validthis: true */

        context.setup(this);
        response.setup(this);
    }

    this.setup = function () {
        setupDust.call(this);
        setupKasane.call(this);

        delete this.setup;
    };

    this.filter = function (name, method) {
        dust.filters[name] = dust.filters[name] || method;
    };

    this.compile = function (source, name) {
        return dust.compile(source, name);
    };

    function validateRenderingParams(view, value, layout, cb) {
        /* jshint validthis: true */

        if (typeof layout !== 'string') {
            layout = this.options.layout;
        }

        if (layout !== false) {
            if (typeof value.view !== 'undefined') {
                throw new Error('`view` is a reserved keyword, cannot be used in response!');
            }

            layout = (this.options.layoutDir ? this.options.layoutDir + '/' : '') + layout;
            value.view = view;

            view = layout;
        }

        return cb(view, value);
    }

    this.render = function (view, value, layout) {
        return validateRenderingParams.call(this, view, value, layout, function (view, value) {
            return when.promise(function renderView(resolve, reject) {
                dust.render(view, value, function renderingCompleted(err, content) {
                    return (err ? reject(err) : resolve(content));
                });
            });
        });
    };

    this.stream = function (view, value, layout) {
        return validateRenderingParams.call(this, view, value, layout, function (view, value) {
            return dust.stream(view, value);
        });
    };

    this.renderSource = function (source, value) {
        return when.promise(function renderSource(resolve, reject) {
            dust.renderSource(source, value, function (err, content) {
                return (err ? reject(err) : resolve(content));
            });
        });
    };

    this.renderFile = function (file, value) {
        var self = this;

        return readFile(file, 'utf8')
            .then(function readSuccessfully(content) {
                return self.renderSource(content, value);
            })
            .catch(function failedToRenderFile(err) {
                if (err.code !== 'ENOENT') {
                    throw err;
                }

                return '';
            });
    };

};

module.exports = function loadRenderer(viewsPath, opts) {
    if (renderer) {
        return renderer;
    }

    return (renderer = new Renderer(viewsPath, opts));
};
