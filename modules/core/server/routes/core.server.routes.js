'use strict';

/**
 * Module dependencies.
 */
var // the path
    path = require('path'),
    // the core policy
	corePolicy = require('../policies/core.server.policy'),
    // the core controller to handle routes
    coreController = require('../controllers/core.server.controller');

module.exports = function (app) {
    // Define error pages
    app.route('/server-error').get(coreController.renderServerError);
    
    // Return a 404 for all undefined api, module or lib routes
    app.route('/:url(api|modules|lib)/*')
    .get(coreController.renderNotFound);

    // define application route
    //app.route('/*').get(coreController.renderIndex);
    app.route('/*').all([coreController.checkRoute], coreController.renderIndex);
    //app.use(coreController.renderIndex);
};