'use strict';

/**
 * Module dependencies
 */
var // the path
    path = require('path'),
    // the user policy
    userPolicy = require('../policies/user.server.policy'),
    // the login controller to handle routes
    loginController = require('../controllers/login.server.controller');

module.exports = function (app) {
    // GET gets login page
    // POST log user in
    app.route('/api/login')
        .get(loginController.checkLoggedIn)
        .post(loginController.login);

    // POST signs user up
    app.route('/api/signup')
        .post(loginController.signUp);

    // GET gets random passphrase
    app.route('/api/generateRandomPassphrase')
        .get(userPolicy.isAllowed, loginController.generateRandomPassphrase);
};