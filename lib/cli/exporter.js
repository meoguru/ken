'use strict';

var path = require('path'),
    fs = require('fs'),

    shien = require('shien'),
    when = require('when'),
    nodeFn = require('when/node'),
    mkdirp = require('mkdirp'),

    paths = require('../variables').path,
    generator = require('../app/components/generator'),

    mkdir = nodeFn.lift(mkdirp),
    writeFile = nodeFn.lift(fs.writeFile);

function ensureCreatingFile(file, content) {
    return mkdir(path.dirname(file))
        .then(function createFile() {
            return writeFile(file, content, 'utf8');
        });
}

exports.exportRoutes = function () {
    return generator()
        .generateRoutes()
        .then(ensureCreatingFile.bind(null, paths.CLIENT_ROUTES));
};

exports.exportViews = function () {
    var gen = generator(),
        extRegex = new RegExp('\\.' + gen.viewExt + '$'),

        deferred = when.defer(),
        promises = [];

    shien.file.traverse(paths.VIEWS, { match: extRegex })
        .on('file', function (file) {
            var view = file.replace(extRegex, '');

            promises.push(
                gen.generateView(view)
                    .then(ensureCreatingFile.bind(
                        null,
                        path.join(paths.CLIENT_VIEWS, view) + '.js'
                    ))
            );
        })
        .on('done', function () {
            when.all(promises)
                .then(deferred.resolve, deferred.reject);
        });

    return deferred.promise;
};
