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

    this.comment = function (chunk, context, bodies, params) {
        return chunk.capture(bodies.block, context, function (out, chunk) {
            out = out.replace(/@\[(\w+)\:([^\]]*)\]/g, '<a href="/thanh-vien?id=$1" class="mention">$2</a>');
            chunk.write(out);
            return chunk.end();
        });
    };

});
