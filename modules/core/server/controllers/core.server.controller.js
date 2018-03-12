'use strict';

var // the path
    path = require('path'),
    // get the current config
	config = require(path.resolve('./config/config')),
    // the error handler
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    // clc for console logging
    clc = require(path.resolve('./config/lib/clc')),
    // the file system reader
    fs = require('fs'),
    // the ability to create requests/promises
    requestPromise = require('request-promise'),
    // for validators and sanitizers
    validator = require('validator')

/**
 * Checks route
 */
exports.checkRoute = function (req, res, next) {
    // if the original url and the path is not the same, reroute to 404
    if(req.originalUrl !== req.route.path) {
        res.status(404).format(
            {
                'application/json': function () {
                    res.json({ title: errorHandler.getErrorTitle({ code: 404 }), message: `The route '${req.originalUrl}' by method '${req.originalMethod}' does not exit.` });
                },
                'default': function () {
                    res.send({ title: errorHandler.getErrorTitle({ code: 404 }), message: `The route '${req.originalUrl}' by method '${req.originalMethod}' does not exit.` });
                }
            }   
        );
    }
    else {
        next();
    }
};

/**
 * Render the main application page
 */
exports.renderIndex = function (req, res) {
    // get the index file path
    var indexFilePath = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'developmentp' ? 'modules/core/server/index/index' : 'modules/core/server/views/index'

    // define the safe user object
    var safeUserObject = null;

    // if a user is logged in
    if (req.user) {
        // create the safe object
        safeUserObject = {
            email: validator.escape(req.user.email),
            created: req.user.created.toString(),
            displayName: validator.escape(req.user.displayName),
            firstName: validator.escape(req.user.firstName),
            lastName: validator.escape(req.user.lastName),
            roles: req.user.roles,
            lastLogin: req.user.lastLogin.toString()
        };
    }

    // render the main index
    res.render(indexFilePath, {
        user: JSON.stringify(safeUserObject),
        sharedConfig: JSON.stringify(config.shared)
    });
};

/**
 * Render the server error page
 */
exports.renderServerError = function (req, res) {
    res.status(500).send({ title: errorHandler.getErrorTitle({ code: 500 }), message: 'Oops, something went wrong' });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function (req, res) {
    res.status(404).format(
        {
            'application/json': function () {
                res.json({ title: errorHandler.getErrorTitle({ code: 404 }), message: 'Oops, sorry, that wasn\'t found' });
            },
            'default': function () {
                res.send({ title: errorHandler.getErrorTitle({ code: 404 }), message: 'Oops, sorry, that wasn\'t found' });
            }
        }   
    );
    
    //res.status(404).send({ title: errorHandler.getErrorTitle({ code: 404 }), message: 'Oops, sorry, that wasn\'t found' });
};

/**
 * Testing basic response
 */
exports.testBasicHelloWorld = function (req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Hello World!");
};