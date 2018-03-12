'use strict';

/**
 * Module dependencies.
 */
var // the default environment configuration
    defaultEnvConfig = require('./default');

module.exports = {
    db: {
        uri: process.env.MLAB_MONGODB_DEV || 'mongodb://localhost:27017/PassportAuthServer',
        options: {
            db: { 
                native_parser: true 
            },
            poolSize: 5
        },
        // Enable mongoose debug mode
        debug: process.env.MONGODB_DEBUG || false
    },
    livereload: false,
    log: {
        // logging with Morgan - https://github.com/expressjs/morgan
        // can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
        format: 'dev',
        fileLogger: {
            directoryPath: process.env.LOG_DIR_PATH || process.cwd(),
            fileName: process.env.LOG_FILE || 'app.log',
            maxsize: 10485760,
            maxFiles: 2,
            json: false
        }
    },
    seedDB: {
        seed: true, //process.env.MONGO_SEED === 'true',
        options: {
            logResults: process.env.MONGO_SEED_LOG_RESULTS !== 'false'
        },
        // Order of collections in configuration will determine order of seeding.
        // i.e. given these settings, the User seeds will be complete before
        // any other seed is performed.
        collections: [
            {
                model: 'User',
                docs: 
                [
                    {
                        overwrite: false,
                        data: {
                            username: 'local-admin',
                            email: 'admin@localhost.com',
                            firstName: 'Admin',
                            lastName: 'Local',
                            roles: ['user', 'admin']
                        }
                    }, 
                    {
                        // Set to true to overwrite this document
                        // when it already exists in the collection.
                        // If set to false, or missing, the seed operation
                        // will skip this document to avoid overwriting it.
                        overwrite: false,
                        data: {
                            username: 'local-user',
                            email: 'user@localhost.com',
                            firstName: 'User',
                            lastName: 'Local',
                            roles: ['user']
                        }
                    }       
                ]
            },
        ]
    }
};