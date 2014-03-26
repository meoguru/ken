'use strict';

var Context = require('kasane').Context;

exports.setup = function () {

    Context.prototype.render = function () {
        return this.response.render.apply(this.response, arguments);
    };

    Context.prototype.respond = function () {
    };

};
