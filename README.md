# Pyradmin

Setting up admin routes is an extremly redundant task.

This module does everything for you.

Pyradmin is currently heavily dependent on mongoose and restify.
It automatically generates routes to administrate the various documents on your MongoDB.

### /!\ Warning /!\
As there are no safeguards, this module SHOULD NOT be used for anything else than setting up an admin interface. For now.

## Usage
* Set up your restify server.
* Require all your mongoose models.
* Instantiate Pyradmin with your configuration.
* Profit!
```sh
var restify = require('restify');
var server = restify.createServer();
server.use(restify.queryParser());
server.use(restify.bodyParser());
var pyradmin = require('pyradmin')({
  basePath: '/admin',
  serverInstance: server
});
// Start the server on whatever port you want
server.listen(8000, function() {
  console.log("server listening on port " + config.port);
});
```

```sh
$ node server.js
```

### Configuration
```sh
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
     * Pyradmin DOES NOT provide its own auth middleware!
     */
    authMiddleware: config.authMiddleware || authMiddleware,
```
### Contributing

Want to contribute? Great!

Just do a pull-request and I will be happy to read it and discuss the feature with you :)
