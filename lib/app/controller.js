'use strict';

var when = require('when');

function Controller() {
    this.beforeFilters = [];
    this.afterFilters = [];
    this.actions = {};
}

Controller.prototype = new function () {

    var slice = Array.prototype.slice;

    function toPattern(pattern) {
        if (typeof pattern === 'string') {
            return (pattern === '*' ?
                /.*/ : new RegExp('^' + pattern + '$'));
        }

        if (Array.isArray(pattern)) {
            return new RegExp('^(' + pattern.join('|') + ')$');
        }

        if (!(pattern instanceof RegExp)) {
            throw new Error('Invalid filter pattern!');
        }

        return pattern;
    }

    function addFilter(filters, pattern, fn) {
        if (typeof fn !== 'function') {
            throw new Error('Filter dispatcher must be a function!');
        }

        filters.push({
            pattern: toPattern(pattern),
            method: fn
        });
    }

    this.before = function (pattern, fn) {
        return addFilter(this.beforeFilters, pattern, fn);
    };

    this.after = function (pattern, fn) {
        return addFilter(this.afterFilters, pattern, fn);
    };

    this.action = function (name) {
        if (typeof name !== 'string') {
            throw new Error('Action name must be a string!');
        }

        var fns = slice.call(arguments, 1);

        if (!this.actions[name]) {
            this.actions[name] = [];
        }

        fns.forEach(function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('Action dispatcher must be a function!');
            }

            this.actions[name].push(fn);
        }, this);
    };

    this.cache = function (pattern, time) {
        var args = slice.call(arguments, 1);

        this.before(pattern, function (req, res, next) {
            res.cache.apply(res, args);
            next();
        });
    };

    function pass(err) {
        if (err) {
            return next(err);
        }
        return pass;
    }

    function dispatch(req, res, next, dispatchers, idx) {
        var self = this;

        if (idx >= dispatchers.length) {
            if (idx === 0) {
                return when();
            }

            next();
            return when(pass);
        }

        return when(null, function () {
                return dispatchers[idx].call(self, req, res, pass);
            })
            .then(
                function (ret) {
                    if (ret === pass) {
                        return dispatch.call(self, req, res, next, dispatchers, idx + 1);
                    }
                },
                function (err) {
                    process.nextTick(function () {
                        throw err;
                    });
                }
            );
    }

    this.handle = function (action) {
        var self = this,

            dispatchers = [],
            finalizers = [];

        this.beforeFilters.forEach(function (filter) {
            if (filter.pattern.test(action)) {
                dispatchers.push(filter.method);
            }
        });

        dispatchers = dispatchers.concat(
            this.actions[action] ?
            this.actions[action] :
            function () {}
        );

        this.afterFilters.forEach(function (filter) {
            if (filter.pattern.test(action)) {
                finalizers.push(filter.method);
            }
        });

        return function (req, res, next) {
            dispatch.call(self, req, res, next, dispatchers, 0)
                .done(function (ret) {
                    if (ret === pass) {
                        return;
                    }

                    if (!res.headersSent) {
                        res.render(req.controller + '/' + req.action);
                    }

                    finalizers.forEach(function () {
                        finalizer();
                    });
                });
        }
    };

};

exports.setup = function (fn) {
    var controller = new Controller;

    if (typeof fn === 'function') {
        fn.call(controller);
    }

    return controller;
};
