'use strict';

var path = require('path'),
    http = require('http'),

    qs = require('qs'),

    shien = require('shien'),
    DoublyLinkedList = shien.collection.DoublyLinkedList,

    connect = require('connect'),

    variables = require('../variables'),

    rack = require('./rack'),
    Request = require('./exchange/request').Request,

    router = require('./components/router'),
    controller = require('./components/controller'),

    app = null;

function App() {
    this.rack = connect();

    this.server = http.createServer(this.rack);
    this.server.inflight = new DoublyLinkedList;

    this.router = router(variables.ROUTES);
}

App.prototype = new function () {

    var defineGetter = shien.object.defineGetter;

    this.init = function () {
        this.rack.use(function preprocessRequest(req, res, next) {
            req.modifiedRequest = new Request(req, res);

            defineGetter(req, 'path', function getPath() {
                var parts = this.url.split('?');
                return (parts.length ? parts[0] : undefined);
            });

            defineGetter(req, 'query', function getQuery() {
                var parts = this.url.split('?'),
                    query = (parts.length >= 2 ? parts[1] : '');

                return qs.parse(query);
            });

            next();

            // TODO: Add inflight request to list
        });

        rack.call(this);
    };

    this.controller = function (p) {
        return controller(path.join(variables.CONTROLLERS, p));
    };

};

function load() {
    if (app) {
        return app;
    }

    return (app = new App);
}

module.exports = load;
