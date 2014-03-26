'use strict';

var userAgent = require('express-useragent');

module.exports = function () {

    var defineProperty = Object.defineProperty;

    return function (context) {
        var req = context.req;

        req.userAgent = userAgent.parse(req.headers['user-agent'] || '');

        defineProperty(context, 'userAgent', {
            get: function () {
                return this.req.userAgent;
            }
        });

        return context.next;
    };

};
