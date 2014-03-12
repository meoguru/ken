'use strict';

var ken = require('../lib/ken');

describe('log', function () {

    it('should do something', function (cb) {
        ken.init()
            .done(function () {
                cb();
            });
    });

});
