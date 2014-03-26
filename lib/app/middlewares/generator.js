'use strict';

var JS_REGEX = /\.js$/;

function returnJavaScript(res, content) {
    res.setHeader('Content-Type', 'application/javascript');
    res.end(content);
}

exports.routes = function (generator) {
    return function (context) {
        return generator.generateRoutes()
            .then(function (content) {
                returnJavaScript(context.res, content);
            });
    };
};

exports.view = function (generator) {
    return function (context) {
        var view = context.path.replace(/^\/+/, '');

        if (!JS_REGEX.test(view)) {
            return context.next;
        }

        view = view.replace(JS_REGEX, '');

        return generator.generateView(view)
            .then(function (content) {
                returnJavaScript(context.res, content);
            });
    };
};
