/**
 * @class node_modules.pyradmin
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
  var logger = function(err, req, res, next) {
    console.log(err);
    console.log(req.body);
    next();
  };
  var authMiddleware = function(req, res, next) {
    console.log('No auth middleware specified!');
    next();
  };
  /**
   * To get all the available models and routes
   */
  var getConfig = function(pyradmin) {
    return function(req, res, next) {
      res.send(Object.keys(pyradmin.config.models));
      next(err);
    }
  };
  /**
   * To get all the documents
   */
  var globalGet = function(Model) {
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
  var globalPost = function(Model) {
    return function(req, res, next) {
      Model.create(req.params, function(err, document) {
        res.send(document);
        next(err);
      });
    }
  };
  /**
   * To get a single documents
   */
  var modelIdGet = function(Model) {
    return function(req, res, next) {
      Model.findOne({_id: req.params.modelId}, function(err, document) {
        res.send(document);
        next(err);
      })
    }
  };
  /**
   * Update a document
   */
  var modelIdPut = function(Model) {
    return function(req, res, next) {
      async.waterfall([
        function findModel(cb) {
          Model.findOne({_id: req.params.modelId}, cb);
        },
        function updateModel(document, cb) {
          console.log(document);
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
     * @cfg {Object} debug=false, enables verbose mode
     */
    debug: config.debug || false,
    /**
     * @cfg {Object} basePath=/admin, the base path to access the routes
     */
    basePath: config.basePath || '/admin',
    logger: config.logger || logger,
    authMiddleware: config.authMiddleware || authMiddleware,
    /**
    * @cfg {Object} Get all mongo models
    */
    models: mongoose.models
  };
  pyradmin.serverInstance = config.serverInstance
  // We  need to perform some checks here
  pyradmin.serverInstance.get(pyradmin.config.basePath + '/config', getConfig(pyradmin));
  Object.keys(pyradmin.config.models).forEach(function(model) {
    var modelName = model.toLowerCase();
    pyradmin.serverInstance.get(pyradmin.config.basePath + '/' + modelName, pyradmin.config.authMiddleware, globalGet(pyradmin.config.models[model]));
    pyradmin.serverInstance.post(pyradmin.config.basePath + '/' + modelName, pyradmin.config.authMiddleware, globalPost(pyradmin.config.models[model]));
    pyradmin.serverInstance.get(pyradmin.config.basePath + '/' + modelName + '/:modelId', pyradmin.config.authMiddleware, modelIdGet(pyradmin.config.models[model]))
    pyradmin.serverInstance.put(pyradmin.config.basePath + '/' + modelName + '/:modelId', pyradmin.config.authMiddleware, modelIdPut(pyradmin.config.models[model]));
    // pyradmin.serverInstance.del(pyradmin.config.basePath + '/' + model + '/:modelId', pyradmin.config.authMiddleware, modelIdDel(pyradmin.config.models[model]));
  });
  return pyradmin;
};
