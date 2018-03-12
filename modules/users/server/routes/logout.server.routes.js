'use strict';

/**
 * Module dependencies
 */
var // the path
    path = require('path'),
    // the logout controller to handle routes
    logoutController = require('../controllers/logout.server.controller');

module.exports = function (app) {
    // GET logs user out
    app.route('/api/logout').get(logoutController.logout);
};