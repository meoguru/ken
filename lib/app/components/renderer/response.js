'use strict';

var inflection = require('inflection'),
    shien = require('shien'),
    when = require('when'),

    Response = require('kasane').Response;

exports.setup = function (renderer) {

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

        value = shien.assign({}, context, renderer.options.global, value);

        return when.promise(function streamView(resolve, reject) {
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
