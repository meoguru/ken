'use strict';

var inflection = require('inflection'),
    _ = require('lodash');

module.exports = new function () {

    function translate(obj, term) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop) && term === obj[prop][0]) {
                return obj[prop][1];
            }
        }
    }

    this.enum = function (obj) {
        obj = obj || {};

        var ret = {},
            e = [];

        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                if (_.isString(obj[prop])) {
                    obj[prop] = [
                        obj[prop],
                        inflection.humanize(obj[prop])
                    ];
                }

                ret[prop] = obj[prop][0];
                e.push(obj[prop][0]);
            }
        }

        ret.enum = e;
        ret.translate = translate.bind(this, obj);

        return ret;
    };

    this.compare = function (docA, docB) {
        if (_.isObject(docA) !== _.isObject(docB)) {
            return (_.isObject(docA) ? 1 : -1);
        }

        var idA = (docA._id ? docA._id.toString() : null),
            idB = (docB._id ? docB._id.toString() : null);

        if (idA === idB) {
            return 0;
        }

        return (idA < idB ? -1 : 1);
    };

};
