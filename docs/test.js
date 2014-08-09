'use strict';

exports.handlers = {
    parseBegin: function () {
        var type = require('jsdoc/tag/type'),
            parse = type.parse;

        type.parse = function () {
            var tagInfo = parse.apply(this, arguments);

            if (Array.isArray(tagInfo.type)) {
                tagInfo.type = tagInfo.type.map(function (t) {
                    return (t === 'function' ? 'Function' : t);
                });
            }

            return tagInfo;
        };
    }
};
