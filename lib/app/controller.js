/**
 * Manages and setups controllers
 *
 * @namespace ken/app/controller
 */

'use strict';

var _ = require('lodash'),
    when = require('when');

/**
 * Constructs a new controller
 *
 * @class
 * @memberOf ken/app/controller
 */
var Controller = exports.Controller = function () {
    this.beforeFilters = [];
    this.afterFilters = [];
    this.actions = {};
}

/**
 * @lends ken/app/controller.Controller
 */
Controller.prototype = new function () {

    var slice = Array.prototype.slice;

    /**
     * Contains a *matching pattern* pairing with a *dispatcher function*.
     *
     * Whenever a request comes in, it will be routed to a specific
     * *controller action*. If name of the controller action is matched with
     * pattern of a controller filter, that filter's dispatcher function
     * will be called on context of the incoming request.
     *
     * If name of the routed controller action is matched with multiple
     * controller filters, those filters will be executed one after another,
     * in the order they are declared in controller's source code.
     *
     * @typedef Filter
     * @type {Object}
     * @property {RegExp} pattern Matching pattern
     * @property {Function} method Dispatcher function
     *
     * @inner
     * @memberOf ken/app/controller.Controller
     */

    /**
     * Condition for filter to be triggered.
     *
     * Condition will be converted to a `RegExp` object using
     * {@link ken/app/controller.Controller.toPattern|toPattern()}
     * and add to `{@link ken/app/controller.Controller~Filter|Filter}` object
     * as matching pattern under property `pattern`.
     *
     * @typedef FilterCondition
     * @type {(String|String[]|RegExp)}
     *
     * @see ken/app/controller.Controller~Filter
     * @see ken/app/controller.Controller.toPattern
     *
     * @inner
     * @memberOf ken/app/controller.Controller
     */

    /**
     * Converts filter condition to `RegExp` pattern.
     *
     * @param {FilterCondition} cond
     * @return {RegExp} pattern
     *
     * @example
     * {@link ken/app/controller.Controller.toPattern|toPattern}('*');
     * //=> /.&#42;/
     *
     * {@link ken/app/controller.Controller.toPattern|toPattern}('remove-post');
     * //=> /^remove-post$/
     *
     * {@link ken/app/controller.Controller.toPattern|toPattern}('remove-.*');
     * //=> /^remove-.*$/
     *
     * {@link ken/app/controller.Controller.toPattern|toPattern}([ 'add-post', 'edit-post', 'remove-post' ]);
     * //=> /^(add-post|edit-post|remove-post)$/
     *
     * {@link ken/app/controller.Controller.toPattern|toPattern}(/^remove-.*^/);
     * //=> /^remove-.*$/
     *
     * @private
     * @memberOf ken/app/controller.Controller
     */
    function toPattern(cond) {
        if (_.isString(cond)) {
            return (cond === '*' ?
                /.*/ : new RegExp('^' + cond + '$'));
        }

        if (Array.isArray(cond)) {
            return new RegExp('^(' + cond.join('|') + ')$');
        }

        if (!(cond instanceof RegExp)) {
            throw new Error('Invalid filter condition!');
        }

        return cond;
    }

    /**
     * Add a filter with condition to filter array.
     *
     * @param {Filter[]} filters Destination filter array
     * @param {FilterCondition} cond Condition for the filter to be triggered
     * @param {Function} fn Filter dispatcher function
     * @return {Function} fn The dispatcher function itself
     *
     * @see ken/app/controller.Controller~Filter
     * @see ken/app/controller.Controller~FilterCondition
     *
     * @private
     * @memberOf ken/app/controller.Controller
     */
    function addFilter(filters, cond, fn) {
        if (typeof fn !== 'function') {
            throw new Error('Filter dispatcher must be a function!');
        }

        filters.push({
            pattern: toPattern(cond),
            method: fn
        });

        return fn;
    }

    /**
     * Creates a `before` filter.
     *
     * @see ken/app/controller.Controller~Filter
     * @see ken/app/controller.Controller~FilterCondition
     *
     * @param {FilterCondition} cond Condition for the filter to be triggered
     * @param {Function} fn Filter dispatcher function
     * @return {Function} fn The dispatcher function itself
     */
    this.before = function (cond, fn) {
        return addFilter(this.beforeFilters, cond, fn);
    };

    /**
     * Creates an `after` filter.
     *
     * @see ken/app/controller.Controller~Filter
     * @see ken/app/controller.Controller~FilterCondition
     *
     * @param {FilterCondition} cond Condition for the filter to be triggered
     * @param {Function} fn Filter dispatcher function
     * @return {Function} fn The dispatcher function itself
     */
    this.after = function (cond, fn) {
        return addFilter(this.afterFilters, cond, fn);
    };

    this.action = function (name) {
        if (!_.isString(name)) {
            throw new Error('Action name must be a string!');
        }

        var self = this,
            fns = slice.call(arguments, 1);

        if (!this.actions[name]) {
            this.actions[name] = [];
        }

        fns.forEach(function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('Action dispatcher must be a function!');
            }

            self.actions[name].push(fn);
        });
    };

    this.cache = function (pattern, time) {
        var args = slice.call(arguments, 1);

        this.before(pattern, function (req, res, next) {
            res.cache.apply(res, args);
            next();
        });
    };

    function pass(next, err) {
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
                return dispatchers[idx].call(self, req, res, pass.bind(null, next));
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

/**
 * Setups a new controller and initializes it
 *
 * @function setup
 * @param {Function} fn Initialization function
 * @return {Controller} c The controller after setup
 *
 * @see ken/app/controller.Controller
 *
 * @memberOf ken/app/controller
 */
exports.setup = function (fn) {
    var controller = new Controller;

    if (typeof fn === 'function') {
        fn.call(controller);
    }

    return controller;
};
