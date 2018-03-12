'use strict';

/**
 * Module dependencies
 */
var // the path
    path = require('path'),
    // the error handler
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    // clc for console logging
    clc = require(path.resolve('./config/lib/clc')),
    // the application configuration
    config = require(path.resolve('./config/config')),
    // lodash
    _ = require('lodash'),
    // the file system reader
    fs = require('fs'),
    // the helper functions
    helpers = require(path.resolve('./config/lib/global-model-helpers')),
    // the User model
    User = require('mongoose').model('User')


exports.getAllUsers = function(req, res){
    User.find({}, function(err, users) {
        if (err) {
            console.log(err)
            return res.status(400).send({
                message: 'Error getting all users'
            })
        }
        else {
            var usersToReturn = []
            _.forEach(users, function(user) {
                usersToReturn.push(createUserReqObject(user))
            })

            res.json({'d' : usersToReturn})
        }
    })
}

// Do error handling when body doesn't have everything necessary
function validationResultErrorHandling(errors, res, req) {
    // holds all the errors in one text
    var errorText = '';
    
    // add all the errors
    for(var x = 0; x < errors.array().length; x++) {
        // if not the last error
        if(x < errors.array().length - 1) {
            errorText += errors.array()[x].msg + '\r\n';
        }
        else {
            errorText += errors.array()[x].msg;
        }
    }

    // send bad request
    var err = new Error(errorText);
    res.status(400).send({ title: errorHandler.getErrorTitle({ code: 400 }), message: errorText });
    errorHandler.logError(req, err);
}

// creates the safe user object to set in the request
function createUserReqObject(user) {
    // get object value
    var safeObj = user.toObject({ hide: 'password lastPasswords passwordUpdatedLast updated created', transform: true });

    // return the safe obj
    return safeObj;
};