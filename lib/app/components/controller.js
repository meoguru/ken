'use strict';

var shien = require('shien');

function Controller() {
    this.filters = [];
    this.actions = {};
}

Controller.prototype = new function () {

    this.before = function (pattern, fn) {
        if (typeof pattern === 'string') {
            pattern = new RegExp(pattern);

        } else if (Array.isArray(pattern)) {
            pattern = new RegExp(pattern.join('|'));

        } else if (!(pattern instanceof RegExp)) {
            throw new Error('Filter pattern must be a string or `RegExp` object!');
        }

        if (typeof fn !== 'function') {
            throw new Error('Filter dispatcher must be a function!');
        }

        this.filters.push({
            pattern: pattern,
            method: fn
        });
    };

    this.action = function (action, fn) {
        if (typeof action !== 'string') {
            throw new Error('Action name must be a string!');
        }

        if (typeof fn !== 'function') {
            throw new Error('Action dispatcher must be a function!');
        }

        this.actions[action] = fn;
    };

    this.dispatch = function (action) {
        var dispatchers = [];

        this.filters.forEach(function (filter) {
            if (filter.pattern.test(action)) {
                dispatchers.push(filter.method);
            }
        });

        var method = this.actions[action];
        if (method) {
            dispatchers.push(method);
        }

        return dispatchers;
    };

};

function load(path) {
    var controller = new Controller;

    if (path) {
        var fn = shien.load(path);

        if (typeof fn === 'function') {
            fn.call(controller);
        }
    }

    return controller;
}

module.exports = load;
