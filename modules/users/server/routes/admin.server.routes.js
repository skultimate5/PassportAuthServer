'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
    adminPolicy = require('../policies/admin.server.policy'),
    adminController = require('../controllers/admin.server.controller');

module.exports = function (app) {
    // TODO : get all users - must be admin
    app.route('/api/admin/getAllUsers')
        .get([adminPolicy.isAllowed], adminController.getAllUsers)
}