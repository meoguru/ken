'use strict';

var when = require('when'),
    ken = require('../ken'),

    mongoose = require('mongoose'),
    Query = mongoose.Query,
    queryProto = Query.prototype;

exports.setup = function () {
    var exec = queryProto.exec;

    queryProto.exec = function () {
        var promise = exec.apply(this, arguments);
        return when(promise);
    };
};
