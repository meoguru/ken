'use strict';

var inflection = require('inflection'),
    shien = require('shien'),
    when = require('when');

module.exports = function (viewsPath, opts) {

    var o = opts || {},
        viewRenderer = require('../components/view-renderer')(viewsPath, o);

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
