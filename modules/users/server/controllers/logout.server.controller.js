'use strict';

/**
 * Module dependencies
 */
var // the path
    path = require('path'),
    // the error handler
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    // clc for console logging
    clc = require(path.resolve('./config/lib/clc'));

/**
 * logs user out
 */
exports.logout = function (req, res) {
    // logout and remove from database
    req.logout();
    req.session = null;

    // create the success status
    var err = {
        code: 200
    };
    
    // return success
    res.json({ 'd': { title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) + " You have successfully logged out!" } });
};