'use strict';

var path = require('path'),
    fs = require('fs'),

    _ = require('lodash');

module.exports = new function () {

    this.regexs = {
        JS: /\.js$/
    };

    function parseOptions(opts) {
        var o = opts || {};

        if (_.isString(o.ignore)) {
            o.ignore = new RegExp(o.ignore);
        }

        if (_.isString(o.match)) {
            o.match = new RegExp(o.match);
        }

        if ((o.ignore && !(o.ignore instanceof RegExp)) ||
            (o.match && !(o.match instanceof RegExp))) {

            throw new Error('File pattern must be string or regular expression!');
        }

        return o;
    }

    function visitSync(root, dir, opts) {
        var files = fs.readdirSync(dir),
            ret = [];

        files.forEach(function (file) {
            var filePath = path.join(dir, file),
                relPath = path.relative(root, filePath);

            if (opts.ignore && opts.ignore.test(relPath)) {
                return;
            }

            var stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                ret = ret.concat(visitSync(root, filePath, opts));

            } else if (stat.isFile() && (!opts.match || opts.match.test(relPath))) {
                ret.push(relPath);
            }
        });

        return ret;
    }

    this.traverseSync = function (root, opts) {
        return visitSync(root, root, parseOptions(opts));
    };

};
