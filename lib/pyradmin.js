/**
 * @class node_modules.pyradmin-node
 *
 * @author Antonin Ribeaud
 *
 * This module generates routes for adminstrating mongo models on a restify API
 */

module.exports = function(config) {
  // namespace
  var pyradmin = {};
  var mongoose = require('mongoose');
  var async = require('async');
  var admin = new mongoose.mongo.Admin(mongoose.connection.db);
  var db = mongoose.connection.db;
  var logger = function(req, res, next) {
    if(pyradmin.config.logs) {
      console.log(err);
      console.log(req.body);
    }
    next();
  };
  var authMiddleware = function(req, res, next) {
    console.error('No auth middleware specified!');
    next();
  };
  /**
   * To get the status of the DB
   */
  var getStatus = function(pyradmin) {
    return function(req, res, next) {
      admin.buildInfo(function (err, info) {
         res.send(info);
         next();
      });
    }
  };
  /**
   * To get all the basic page configuration
   */
  var getConfig = function(pyradmin) {
    var remoteConfig = {
      menu: {
        stats: {
          name: 'DB Statistics',
          description: 'statistics about your database',
          readOnly: true,
          actions: {update: '/stats'}
        },
        status: {
          name: 'DB Status',
          description: 'status of the database',
          readOnly: true,
          actions: {update: '/status'}
        },
        models: {
          name: 'Schemas',
          description: 'Schemas from the database',
          readOnly: true,
          actions: {update: '/models'}
        }
      }
    };
    return function(req, res, next) {
      res.send(remoteConfig);
      next();
    }
  };
  /**
   * To get the models of db
   */
  var getModels = function(pyradmin) {
    return function(req, res, next) {
      var toSend = {};
      Object.keys(pyradmin.config.models).forEach(function(model) {
        toSend[model] = {};
        Object.keys(pyradmin.config.models[model].schema.paths).forEach(function(elem) {
          toSend[model][pyradmin.config.models[model].schema.paths[elem].path] = {};
          if(!pyradmin.config.models[model].schema.paths[elem].instance) {
            try {
              toSend[model][pyradmin.config.models[model].schema.paths[elem].path]["type"] = typeof pyradmin.config.models[model].schema.paths[elem].options.type();
            }
            catch(e) {
              console.log(pyradmin.config.models[model].schema.paths[elem]);
              if(pyradmin.config.models[model].schema.paths[elem].SchemaArray) {
                toSend[model][pyradmin.config.models[model].schema.paths[elem].path]["type"] = "Array";
              }
              else {
                toSend[model][pyradmin.config.models[model].schema.paths[elem].path]["type"] = "Object";
              }
            }
          }
          else {
            toSend[model][pyradmin.config.models[model].schema.paths[elem].path]["type"] = pyradmin.config.models[model].schema.paths[elem].instance;
          }
          toSend[model][pyradmin.config.models[model].schema.paths[elem].path]["required"] = pyradmin.config.models[model].schema.paths[elem].options.required || false;
          toSend[model][pyradmin.config.models[model].schema.paths[elem].path]["unique"] = pyradmin.config.models[model].schema.paths[elem].options.unique || false;
        });
      });
      res.send(toSend);
      next();
    }
  };
  /**
   * To get stats about the db
   */
  var getStats = function(pyradmin) {
    return function(req, res, next) {
      db.stats(function(err, stats) {
        res.send(stats);
        next();
      });
    }
  };
  /**
   * To get all the documents
   */
  var getAllDocuments = function(Model) {
    return function(req, res, next) {
      Model.find({}, function(err, documents) {
        res.send(documents);
        next(err);
      });
    }
  };
  /**
   * Create a new document
   */
  var postNewDocument = function(Model) {
    return function(req, res, next) {
      Model.create(req.params, function(err, document) {
        res.send(document);
        next(err);
      });
    }
  };
  /**
   * To get a single document
   */
  var getByModelId = function(Model) {
    return function(req, res, next) {
      Model.findOne({_id: req.params.modelId}, function(err, document) {
        res.send(document);
        next(err);
      })
    }
  };
  /**
   * To remove a single document
   */
  var delByModelId = function(Model) {
    return function(req, res, next) {
      Model.findOne({_id: req.params.modelId}, function(err, document) {
        document.remove(function(err) {
          if(err) {
            return next(err);
          }
          res.send(200);
          next(null);
        });
      })
    }
  };
  /**
   * Update a document
   */
  var putByModelId = function(Model) {
    return function(req, res, next) {
      async.waterfall([
        function findModel(cb) {
          Model.findOne({_id: req.params.modelId}, cb);
        },
        function updateModel(document, cb) {
          if(!document) {
            return cb(new Error('Document not found'));
          }
          Object.keys(req.params).forEach(function(param) {
            if(document[param] !== 'undefined') {
              document[param] = req.params[param];
            }
          });
          document.save(function(err) {
            if(err) {
              return cb(err);
            }
            res.send(document);
            cb(null);
          });
      }], next);
    }
  };
  /**
   * Configuration
  */
  config = config || {};
  pyradmin.config = {
    /**
     * {boolean} logs=false, enables verbose mode
     */
    logs: config.logs || false,
    /**
     * {string} basePath=/admin, the base path to access the routes
     */
    basePath: config.basePath || '/admin',
    /**
     * {function} a custom function for the logs
     */
    logger: config.logger || logger,
    /**
     * {function} a custom function acting as an auth middleware
     */
    authMiddleware: config.authMiddleware || authMiddleware,
    /**
    * {Array} all the available mongo models
    */
    models: mongoose.models
  };

  pyradmin.serverInstance = config.serverInstance
  /*
  * Get the pyradmin config
  */
  pyradmin.serverInstance.get(pyradmin.config.basePath + '/config', getConfig(pyradmin));
  /*
  * Get the db status
  */
  pyradmin.serverInstance.get(pyradmin.config.basePath + '/status', getStatus(pyradmin));
  /*
  * Get some db statistics
  */
  pyradmin.serverInstance.get(pyradmin.config.basePath + '/stats', getStats(pyradmin));
  /*
  * Get the models description and info
  */
  pyradmin.serverInstance.get(pyradmin.config.basePath + '/models', getModels(pyradmin));
  Object.keys(pyradmin.config.models).forEach(function(model) {
    // Mongoose model names are in uppercase, which is not really convenient
    var modelName = model.toLowerCase();
    /*
    * Get all documents
    */
    pyradmin.serverInstance.get(
      pyradmin.config.basePath + '/' + modelName,
      pyradmin.config.authMiddleware,
      pyradmin.config.logger,
      getAllDocuments(pyradmin.config.models[model]));
    /*
    * Create a new document
    */
    pyradmin.serverInstance.post(
      pyradmin.config.basePath + '/' + modelName,
      pyradmin.config.authMiddleware,
      pyradmin.config.logger,
      postNewDocument(pyradmin.config.models[model]));
    /*
    * Get a document by id
    */
    pyradmin.serverInstance.get(
      pyradmin.config.basePath + '/' + modelName + '/:modelId',
      pyradmin.config.authMiddleware,
      pyradmin.config.logger,
      getByModelId(pyradmin.config.models[model]));
    /*
    * Update a document by id
    */
    pyradmin.serverInstance.put(
      pyradmin.config.basePath + '/' + modelName + '/:modelId',
      pyradmin.config.authMiddleware,
      pyradmin.config.logger,
      putByModelId(pyradmin.config.models[model]));
    /*
    * Delete a document by id
    */
    pyradmin.serverInstance.del(
      pyradmin.config.basePath + '/' + modelName + '/:modelId',
      pyradmin.config.authMiddleware,
      pyradmin.config.logger,
      delByModelId(pyradmin.config.models[model]));
  });
  return pyradmin;
};
