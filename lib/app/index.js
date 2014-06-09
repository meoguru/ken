'use strict';

var path = require('path'),
    http = require('http'),

    shien = require('shien'),
    DoublyLinkedList = shien.collection.DoublyLinkedList,

    kasane = require('kasane'),
    yari = require('yari'),
    passport = require('passport'),

    // soketto = require('soketto'),

    variables = require('../variables'),
    paths = variables.path,

    rack = require('./rack'),

    router = require('./components/router'),
    renderer = require('./components/renderer'),
    generator = require('./components/generator'),
    controller = require('./components/controller'),

    app = null;

function App() {
    this.devOrTest = ([ 'development', 'test' ].indexOf(process.env.NODE_ENV) >= 0);

    this.rack = kasane();

    // this.soketto = soketto();

    this.server = http.createServer(this.rack.handle());
    this.server.inflight = new DoublyLinkedList;

    this.passport = passport;

    this.router = router(paths.ROUTES);

    this.renderer = renderer(paths.VIEWS, {
        layoutDir: variables.view.LAYOUTS_DIR,
        layout: variables.view.BASE_LAYOUT,
        cache: !this.devOrTest,
        stripWhitespaces: !this.devOrTest
    });

    this.generator = generator(this.renderer, {
        router: this.router
    });

    this.helpers = {};
    this.models = {};
    this.modelPlugins = {};
    this.services = {};
    this.controllers = {};
}

App.prototype = new function () {

    this.init = function () {
        var self = this;

        this.rack.use(function addInflightEntry(context) {
            self.server.inflight.push(context);
            return context.next;
        });

        rack.initialize(this);
    };

    this.setup = function () {
        var modules = shien.load(paths.INITIALIZERS, { multi: true });

        modules.forEach(function iterateModules(module) {
            if (typeof module === 'function') {
                module();
            }
        });

        rack.finalize(this);
    };

    this.helper = function (name) {
        if (this.helpers[name]) {
            return this.helpers[name];
        }

        return (this.helpers[name] = shien.load(
            path.join(paths.HELPERS, name)
        ));
    };

    this.model = function (name) {
        if (this.models[name]) {
            return this.models[name];
        }

        return (this.models[name] = yari.modelize(name));
    };

    this.modelPlugin = function (name) {
        if (this.modelPlugins[name]) {
            return this.modelPlugins[name];
        }

        return (this.modelPlugins[name] = shien.load(
            path.join(paths.MODEL_PLUGINS, name)
        ));
    };

    this.service = function (name) {
        if (this.services[name]) {
            return this.services[name];
        }

        return (this.services[name] = shien.load(
            path.join(paths.SERVICES, name)
        ));
    }

    this.controller = function (name) {
        if (this.controllers[name]) {
            return this.controllers[name];
        }

        return (this.controllers[name] = controller(
            path.join(paths.CONTROLLERS, name)
        ));
    };

};

module.exports = function loadApp() {
    if (app) {
        return app;
    }

    return (app = new App);
};
