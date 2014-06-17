'use strict';

var _ = require('lodash');

module.exports = new function () {

    _.assign(this, require('./core'));

    this.file = require('./file');
    this.db = require('./db');

};
