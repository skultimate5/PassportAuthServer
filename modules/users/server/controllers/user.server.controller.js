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
    User = require('mongoose').model('User'),
    randomize = require('randomatic'),
    nodemailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport');

/**
 * Get the profile details
 */
exports.readProfile = function (req, res) {
    // create safe profile object
    var user = createUserReqObject(req.user);

    // send data
    res.json({ 'd': user });
};

/**
 * Updates the profile details
 */
exports.updateProfile = function (req, res) {
    // create the updated values object
    var updatedValues = {
        'firstName': _.has(req.body, 'firstName') ? req.body.firstName : undefined,
        'lastName': _.has(req.body, 'lastName') ? req.body.lastName : undefined,
        'username': _.has(req.body, 'username') ? req.body.username : undefined,
        'email': _.has(req.body, 'email') ? req.body.email : undefined
    };

    // remove all undefined members
    helpers.removeUndefinedMembers(updatedValues);

    // if there is something to update
    if(Object.keys(updatedValues).length > 0) {
        // if first name
        if(updatedValues.firstName) {
            req.checkBody('firstName', 'First name must contain only letters.').onlyContainsAlphaCharacters();
        }

        // if last name
        if(updatedValues.lastName) {
            req.checkBody('lastName', 'Last name must contain only letters.').onlyContainsAlphaCharacters();
        }

        // validate errors
        req.getValidationResult().then(function(errors) {
            // if any errors exists
            if(!errors.isEmpty()) {
                validationResultErrorHandling(errors, res, req)
            }
            else {
                // update the values
                req.user.firstName = updatedValues.firstName ? updatedValues.firstName : req.user.firstName;
                req.user.lastName = updatedValues.lastName ? updatedValues.lastName : req.user.lastName;
                req.user.username = updatedValues.username ? updatedValues.username : req.user.username;
                req.user.email = updatedValues.email ? updatedValues.email : req.user.email;

                // update user
                req.user.save(function(err) {
                    // if error occurred
                    if (err) {
                        // send internal error
                        res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                        console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                        errorHandler.logError(req, err);
                    }
                    else {
                        // read the profile
                        module.exports.readProfile(req, res);
                    }
                });
            }
        });
    }
    else {
        // read the profile
        module.exports.readProfile(req, res);
    }
};

/**
 * Updates password
 */
exports.updatePassword = function (req, res) {
    // validate existence
    req.checkBody('oldPassword', 'Old password is required.').notEmpty();
    req.checkBody('newPassword', 'New password is required.').notEmpty();
    req.checkBody('confirmedPassword', 'Confirmed password is required.').notEmpty();
    req.checkBody('confirmedPassword', 'Confirmed password should be equal to new password.').isEqual(req.body.newPassword);

    // validate errors
    req.getValidationResult().then(function(errors) {
        if(!errors.isEmpty()) {
            validationResultErrorHandling(errors, res, req)
        }
        else {
            // compare current password equality
            req.user.comparePassword(req.body.oldPassword, function(err, isMatch) {
                // if error occurred occurred
                if (err) {
                    // send internal error
                    res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                    console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                    errorHandler.logError(req, err);
                }
                else if(!isMatch) {
                    const errorText = 'Current password does not match';
                    err = new Error(errorText);
                    res.json({ 'd': { error: true, title: errorText, message: errorText } });
                    errorHandler.logError(req, err);
                }
                else {
                    // save new password
                    req.user.password = req.body.newPassword;
    
                    // update user
                    req.user.save(function(err) {
                        // if error occurred
                        if (err) {
                            // send internal error
                            res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                            console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                            errorHandler.logError(req, err);
                        }
                        else {
                            // read the profile
                            module.exports.readProfile(req, res);
                        }
                    });
                }
            });	
        }
    });
};

exports.forgotUsername = function (req, res) {
    // validate existence
    req.checkBody('email', 'Email is required.').notEmpty();
    
    // validate errors
    req.getValidationResult().then(function(errors) {
        // if any errors exists
        if(!errors.isEmpty()) {
            validationResultErrorHandling(errors, res, req)
        }
        else {
            // Find username based on this email and send it back
            User.findOne({ 'email': req.body.email }).exec(function (err, user) {
                // if error occurred
                if (err) {
                    return res.status(400).send({
                        message: 'Error finding email'
                    })
                } 
                else if (user) {     
                    res.json({'d' : user.username})       
                }
                else {
                    return res.status(400).send({
                        message: 'No user found with that email'
                    })
                }
            });
        }
    })
}

exports.forgotPassword = function (req, res) {
    // validate existence
    req.checkBody('usernameOrEmail', 'Username/email is required.').notEmpty();
    
    // validate errors
    req.getValidationResult().then(function(errors) {
        if(!errors.isEmpty()) {
            validationResultErrorHandling(errors, res, req)
        }
        else {
            // find a user whose username/email is the same as the forms username/email
            const orOption = { $or: [{ 'username': req.body.usernameOrEmail.toLowerCase() }, { 'email': req.body.usernameOrEmail.toLowerCase() }] };

            User.findOne(orOption).exec(function (err, user) {
                // if error occurred
                if (err) {
                    return res.status(400).send({
                        message: 'Error finding user'
                    })
                } 
                else if (user) {     
                    // create token (6 digits long)
                    var token = randomize('0', 6)

                    // email this token to user
                    var options = {
                            host: 'smtp.gmail.com',
                            port: 465,
                            secure: true, // use SSL
                            auth: {
                                user: process.env.GMAIL_TEST_USER,
                                pass: process.env.GMAIL_TEST_PASS
                            }
                        },
                        transporter = nodemailer.createTransport(smtpTransport(options)),
                        mailOptions = {
                            from:    process.env.GMAIL_TEST_USER,
                            to:      user.email,
                            subject: 'Password Reset',
                            text:    `Here is your password reset token : ${token}. It expires in 30 minutes`
                        };
            
                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                            console.log(error)
                            return res.status(400).send({
                                message: `Error sending email`
                            });
                        }
                        else {
                            console.log('Message sent: ' + info.response)
                            // Store this token with the user and clear current password in db
                            user.update({'password' : null, 'token' : token, 'tokenCreated' : new Date()}).exec(function(err) {
                                if(err) {
                                    return res.status(400).send({
                                        message: `Error removing user's password`
                                    });
                                }
                                else {
                                    // server responds with 200 response saying that the email was sent
                                    res.json({'d' : {'username': user.username, 'email': user.email, 'message' : 'Email was sent'}})
                                }
                            }) 
                        }
            
                        transporter.close()
                    })
                }
                else {
                    return res.status(400).send({
                        message: 'No user found with that info'
                    })
                }
            });
        }
    });
}

exports.checkPasswordToken = function (req, res) {
    req.checkBody('username', 'Username is required.').notEmpty();
    req.checkBody('token', 'Password reset token is required.').notEmpty();    
    req.checkBody('token', 'Password reset token is not a number.').isNumber(); 
    
    // validate errors
    req.getValidationResult().then(function(errors) {
        if(!errors.isEmpty()) {
            validationResultErrorHandling(errors, res, req)
        }
        else {
            User.findOne({ 'username': req.body.username.toLowerCase() }).exec(function (err, user) {
                if (err) {
                    return res.status(400).send({
                        message: 'Error finding username'
                    })
                } 
                else if (user) {     
                    var tokenSecondsDifference = (new Date() - user.tokenCreated) / 1000

                    // Check that token hasn't expired (30 minutes) and that the tokens match
                    if (user.token === req.body.token && tokenSecondsDifference < 30 * 60) {
                        res.json({'d' : {'message' : 'Tokens match'}})
                    }
                    else if (user.token === req.body.token) {
                        res.json({'d' : {'error': true, 'message' : 'Token has expired'}})
                    }
                    else {
                        res.json({'d' : {'error': true, 'message' : 'Tokens do not match'}})
                    }
                }
                else {
                    return res.status(400).send({
                        message: 'No user found with that username'
                    })
                }
            });
        }
    })
}

/**
 * Resets password
 */
exports.resetPassword = function (req, res) {
    req.checkBody('username', 'Username is required.').notEmpty();
    req.checkBody('newPassword', 'New Password is required').notEmpty();
    req.checkBody('confirmedPassword', 'Confirmed Password is required').notEmpty();
    req.checkBody('token', 'Password reset token is required').notEmpty();
    req.checkBody('token', 'Password reset token is not a number.').isNumber(); 

    // Validate that newPassword and confirmedPassword are the same before doing anything else
    if (req.body.newPassword === req.body.confirmedPassword) {
        req.getValidationResult().then(function(errors) {
            if(!errors.isEmpty()) {
                validationResultErrorHandling(errors, res, req)
            }
            else {
                // find user based on username
                User.findOne({ 'username': req.body.username.toLowerCase() }, function(err, foundUser) {
                    if (err) {
                        return next(err);
                    }
                    else if(foundUser) {
    
                        if (req.body.token === foundUser.token) {
                            foundUser.password = req.body.newPassword;
                            foundUser.token = null
                            foundUser.tokenCreated = null
        
                            foundUser.save(function(err) {
                                if (err) {
                                    res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                                    console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                                    errorHandler.logError(req, err);
                                }
                                else {
                                    res.json({ 'd': { title: errorHandler.getErrorTitle({ code: 200 }), message: 'Password reset was a success!' } });
                                }
                            });
                        }
                        else {
                            return res.status(400).send({
                                message: 'Token does not match'
                            })
                        }
                    }
                    else {
                        return res.status(400).send({
                            message: 'No user found with that email'
                        })
                    }
                });
            }
        });
    }
    else {
        return res.status(400).send({
            message: 'New password and confirmed password do not match'
        })
    }
    
};

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
    var safeObj = user.toObject({ hide: 'password lastPasswords', transform: true });

    // return the safe obj
    return safeObj;
};