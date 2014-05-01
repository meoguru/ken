'use strict';

var inflection = require('inflection'),
    shien = require('shien'),
    when = require('when'),

    Response = require('kasane').Response;

exports.setup = function (renderer) {

    var opts = renderer.options;

    Response.prototype.render = function (view, value, layout) {
        if (typeof view !== 'string') {
            layout = value;
            value = view;
            view = null;
        }

        if (typeof value !== 'object') {
            layout = value;
            value = {};
        }

        var context = this.context;

        if (!view) {
            view = inflection.transform(context.controller, [ 'underscore', 'dasherize' ]) + '/' +
                inflection.transform(context.action, [ 'underscore', 'dasherize' ]);
        }

        return when.promise(function renderView(resolve, reject) {
            var res = context.res;

            if (context.params.format === 'json') {
                var indentation = (opts.stripWhitespaces ? 0 : 4),
                    content = JSON.stringify(value, null, indentation);

                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(content);

                return resolve();
            }

            // Add contextual and global information to response
            value = shien.assign({}, context, opts.global, value);

            if (!opts.stream) {
                return renderer.render(view, value, layout)
                    .then(function (content) {
                        context.res.end(content);
                        resolve();
                    });
            }

            renderer.stream(view, value, layout)
                .on('data', function (data) {
                    context.res.write(data);
                })
                .on('end', function () {
                    context.res.end();
                    resolve();
                })
                .on('error', function (err) {
                    reject(err);
                });
        });
    };

};
