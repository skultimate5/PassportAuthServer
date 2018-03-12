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
    // lodash
    _ = require('lodash'),
    // passport for local authentication
    passport = require('passport'),
    // the application configuration
    config = require(path.resolve('./config/config')),
    // generator for a strong password
    generatePassword = require('generate-password'),
    // tester for ensuring a stronger password
    owasp = require('owasp-password-strength-test');

// configure owasp
owasp.config(config.shared.owasp);

/**
 * Checks if user is already authenticated
 */
exports.checkLoggedIn = function (req, res) {
    // if user is authenticated in the session
    if (req.isAuthenticated()) {
        // return is logged in
        res.json({ 'd': { 'isLoggedIn': true } });
    }
    else {
        // return is logged in
        res.json({ 'd': { 'isLoggedIn': false } });
    }
};

/**
 * Signs user up
 */
exports.signUp = function (req, res, next) {
    req.checkBody('username', 'Username is required.').notEmpty();
    req.checkBody('firstName', 'First name is required.').notEmpty();
    req.checkBody('lastName', 'Last name is required.').notEmpty();
    req.checkBody('email', 'Email is required.').notEmpty();
    req.checkBody('password', 'Password is required.').notEmpty();
    req.checkBody('password', `Please enter a passphrase or password with ${config.shared.owasp.minLength} or more characters, numbers, lowercase, uppercase, and special characters.`).isStrongPassword();
    req.checkBody('confirmedPassword', 'Confirmed password is required.').notEmpty();
    req.checkBody('confirmedPassword', 'Confirmed password should be equal to new password.').isEqual(req.body.password);
    
    req.getValidationResult().then(function(errors) {
        if(!errors.isEmpty()) {
            var errorText = '';

            for(var x = 0; x < errors.array().length; x++) {
                if(x < errors.array().length - 1) {
                    errorText += errors.array()[x].msg + '\r\n';
                }
                else {
                    errorText += errors.array()[x].msg;
                }
            }

            // send bad request
            err = new Error(errorText);
            res.status(400).send({ title: errorHandler.getErrorTitle({ code: 400 }), message: errorText });
            errorHandler.logError(req, err);
        } 
        else {
            // authenticate the user with a signup
            passport.authenticate('local-signup', { failureFlash : true }, function (err, user, info) {
                if(err) {
                    res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                    console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                    errorHandler.logError(req, err);
                }
                else if(!user && info) {
                    err = new Error(info.message);
                    res.json({ 'd': { error: true, title: info.message, message: info.message } });
                    errorHandler.logError(req, err);
                }
                else if(!user && !info) {
                    const errorText = 'Something went wrong when trying to sign you up. Please try again later.';
                    err = new Error(errorText);
                    res.json({ 'd': { error: true, title: errorText, message: errorText } });
                    errorHandler.logError(req, err);
                }
                else {
                    res.json({ 'd': { title: errorHandler.getErrorTitle({ code: 200 }), message: errorHandler.getGenericErrorMessage({ code: 200 }) + ' Successful sign up.' } });
                }
            })(req, res, next);
        }
    });
};

/**
 * Logs user in
 */
exports.login = function (req, res, next) {
    // authenticate user login
    passport.authenticate('local-login', function (err, user, info) {
        if(err) {
            res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
            console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
            errorHandler.logError(req, err);
        }
        else if(!user && info) {
            err = new Error(info.message);
            res.json({ 'd': { error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getDetailedErrorMessage(err) } });
            errorHandler.logError(req, err);
        }
        else if(!user && !info) {
            // return not authenticated
            const errorText = 'Incorrect username/password';
            err = new Error(errorText);
            res.json({ 'd': { error: true, title: errorText, message: errorText } });
            errorHandler.logError(req, err);
        }
        else {
            res.json({ title: errorHandler.getErrorTitle({ code: 200 }), message: errorHandler.getGenericErrorMessage({ code: 200 }) + ' Successful login.' });
        }
    })(req, res, next);
};

/**
 * Generates random passphrase
 */
exports.generateRandomPassphrase = function (req, res, next) {
    // if user is authenticated in the session
    if (req.isAuthenticated() && _.indexOf(req.user.roles, 'admin') != -1) {
        var passphrase = generateRandomPassphrase();

        if(!passphrase) {
            // try one more time
            passphrase = generateRandomPassphrase();
        }

        res.json({ 'd': { 'passphrase': passphrase } });
    }
    else {
        // create forbidden error
        err = new Error(errorHandler.getGenericErrorMessage({ code: 403 }));
        res.status(403).send({ title: errorHandler.getErrorTitle({ code: 403 }), message: errorHandler.getGenericErrorMessage({ code: 403 }) });
        errorHandler.logError(req, err);
    }
};

// Generates random passphrase
function generateRandomPassphrase() {
    var password = '';
    var repeatingCharacters = new RegExp('(.)\\1{2,}', 'g');

    // iterate until the we have a valid passphrase
    // NOTE: Should rarely iterate more than once, but we need this to ensure no repeating characters are present
    while (password.length < 20 || repeatingCharacters.test(password)) {
        // build the random password
        password = generatePassword.generate({
            length: Math.floor(Math.random() * (20)) + 20, // randomize length between 20 and 40 characters
            numbers: true,
            symbols: false,
            uppercase: true,
            excludeSimilarCharacters: true
        });

        // check if we need to remove any repeating characters
        password = password.replace(repeatingCharacters, '');
    }

    // send the rejection back if the passphrase fails to pass the strength test
    if (owasp.test(password).errors.length) {
        return null;
    } 
    else {
        // return with the validated passphrase
        return password;
    }
}