'use strict';

var qs = require('qs');

module.exports = function () {

    var defineProperty = Object.defineProperty;

    return function (context) {
        defineProperty(context, 'query', {
            get: function () {
                return this.req.query;
            },
            set: function (value) {
                return (this.req.query = value);
            }
        });

        var req = context.req,
            parts = req.url.split('?');

        req.query = (parts.length > 1 ? qs.parse(parts[1]) : {});

        return context.next;
    };

};
