/**
 * @class node_modules.pyradmin
 *
 * @author Antonin Ribeaud
 *
 * This module generates routes for adminstrating mongo models on a restify API
 *
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above
 *      copyright notice, this list of conditions and the following
 *      disclaimer in the documentation and/or other materials provided
 *      with the distribution.
 *    * Neither the name of Yoovant nor the names of its
 *      contributors may be used to endorse or promote products derived
 *      from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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
      next();
    }
  };
  /**
   * To get all the documents
   */
  var globalGet = function(Model) {
    return function(req, res, next) {
      Model.find({}, function(err, models) {
        res.send(models);
        next();
      });
    }
  };
  /**
   * Create a new document
   */
  var globalPost = function(Model) {
    return function(req, res, next) {
      Model.create(req.params, function(err, model) {
        res.send(model);
        next();
      });
    }
  };
  /**
   * To get a single documents
   */
  var modelIdGet = function(Model) {
    return function(req, res, next) {
      Model.findOne({_id: req.params.modelId}, function(err, model) {
        res.send(model);
        next();
      })
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
    Get all mongo models
    */
    models: mongoose.models
  };
  pyradmin.serverInstance = config.serverInstance
  // We  need to perform some checks here
  pyradmin.serverInstance.get(pyradmin.config.basePath + '/config', getConfig(pyradmin));
  Object.keys(pyradmin.config.models).forEach(function(model) {
    pyradmin.serverInstance.get(pyradmin.config.basePath + '/' + model.toLowerCase(), pyradmin.config.authMiddleware, globalGet(pyradmin.config.models[model]));
    pyradmin.serverInstance.post(pyradmin.config.basePath + '/' + model.toLowerCase(), pyradmin.config.authMiddleware, globalPost(pyradmin.config.models[model]));
    pyradmin.serverInstance.get(pyradmin.config.basePath + '/' + model.toLowerCase() + '/:modelId', pyradmin.config.authMiddleware, modelIdGet(pyradmin.config.models[model]))
    // pyradmin.serverInstance.put(pyradmin.config.basePath + '/' + model + '/:modelId', pyradmin.config.authMiddleware, modelIdPut(pyradmin.config.models[model]));
    // pyradmin.serverInstance.del(pyradmin.config.basePath + '/' + model + '/:modelId', pyradmin.config.authMiddleware, modelIdDel(pyradmin.config.models[model]));
  });
  return pyradmin;
};
