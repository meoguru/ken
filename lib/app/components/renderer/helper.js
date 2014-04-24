'use strict';

var shien = require('shien'),
    dust = require('dustjs-linkedin'),

    router = require('../router')();

shien.assign(dust.helpers, new function () {

    this.url = function (chunk, context, bodies, params) {
        var route = params.route;
        delete params.route;

        return chunk.write(
            router.url(route, params)
        );
    };

});
