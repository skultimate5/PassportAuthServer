'use strict';

/**
 * Module dependencies
 */
var // the path
    path = require('path'),
    // the user policy
    userPolicy = require('../policies/user.server.policy'),
    // the user controller to handle routes
    userController = require('../controllers/user.server.controller');

module.exports = function (app) {
    // =========================================================================
    // Profile Routes ==========================================================
    // =========================================================================

    // GET gets user's edit profile information
    // POST updates user's profile information
    app.route('/api/user/editProfile').all([userPolicy.isAllowed])
    .get(userController.readProfile)
    .post(userController.updateProfile);


    
    // =========================================================================
    // Password Routes =========================================================
    // =========================================================================

    // POST updates user's password
    app.route('/api/user/updatePassword').all([userPolicy.isAllowed])
    .post(userController.updatePassword);



    // =========================================================================
    // Forgot Routes ===========================================================
    // =========================================================================

    // POST returns username that matches the passed in email address
    app.route('/api/user/forgotUsername')
    .post(userController.forgotUsername)

    // POST returns a message that says the email with token was sent properly
    app.route('/api/user/forgotPassword')
    .post(userController.forgotPassword)

    // POST checks to see if username and token match for password reset. Returns a success message if they match
    app.route('/api/user/resetPassword/checkToken')
    .post(userController.checkPasswordToken)

    // POST resets specific user's password after checking token
    app.route('/api/user/resetPassword')
    .post(userController.resetPassword);
}