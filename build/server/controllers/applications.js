// Generated by CoffeeScript 1.9.3
var async, controller, exec, log, restartController, sendError, updateController;

controller = require('../lib/controller');

async = require('async');

log = require('printit')();

exec = require('child_process').exec;

sendError = function(res, err, code) {
  if (code == null) {
    code = 500;
  }
  if (err == null) {
    err = {
      stack: null,
      message: "Server error occured"
    };
  }
  console.log("Sending error to client :");
  console.log(err.stack);
  return res.send(code, {
    error: err.message,
    success: false,
    message: err.message,
    stack: err.stack,
    code: err.code != null ? err.code : void 0
  });
};

updateController = function(count, callback) {
  return exec("npm -g update cozy-controller", function(err, stdout, stderr) {
    if (err || stderr) {
      if (count < 2) {
        return updateController(count + 1, callback);
      } else {
        return callback("Error during controller update after " + (count + 1) + " try: " + stderr);
      }
    } else {
      return restartController(callback);
    }
  });
};

restartController = function(callback) {
  return exec("supervisorctl restart cozy-controller", function(err, stdout) {
    if (err) {
      return callback("This feature is available only if controller is managed" + " by supervisor");
    } else {
      log.info("Controller was successfully restarted.");
      return callback();
    }
  });
};


/*
    Install application.
        * Check if application is declared in body.start
        * if application is already installed, just start it
 */

module.exports.install = function(req, res, next) {
  var err, manifest;
  if (req.body.start == null) {
    err = new Error("Manifest should be declared in body.start");
    return sendError(res, err, 400);
  }
  manifest = req.body.start;
  return controller.install(req.connection, manifest, function(err, result) {
    if (err != null) {
      log.error(err.toString());
      return sendError(res, err, 400);
    } else {
      return res.send(200, {
        "drone": {
          "port": result.port
        }
      });
    }
  });
};


/*
    Start application
        * Check if application is declared in body.start
        * Check if application is installed
        * Start application
 */

module.exports.start = function(req, res, next) {
  var err, manifest;
  if (req.body.start == null) {
    err = new Error("Manifest should be declared in body.start");
    return sendError(res, err, 400);
  }
  manifest = req.body.start;
  return controller.start(manifest, function(err, result) {
    if (err != null) {
      log.error(err.toString());
      err = new Error(err.toString());
      return sendError(res, err, 400);
    } else {
      return res.send(200, {
        "drone": {
          "port": result.port
        }
      });
    }
  });
};


/*
    Stop application
        * Check if application is installed
        * Stop application
 */

module.exports.stop = function(req, res, next) {
  var name;
  name = req.params.name;
  return controller.stop(name, function(err, result) {
    if (err != null) {
      log.error(err.toString());
      err = new Error(err.toString());
      return sendError(res, err, 400);
    } else {
      return res.send(200, {
        app: result
      });
    }
  });
};


/*
    Uninstall application
        * Check if application is installed
        * Uninstall application
 */

module.exports.uninstall = function(req, res, next) {
  var name;
  name = req.params.name;
  return controller.uninstall(name, function(err, result) {
    if (err != null) {
      log.error(err.toString());
      err = new Error(err.toString());
      return sendError(res, err, 400);
    } else {
      return res.send(200, {
        app: result
      });
    }
  });
};


/*
    Update application
        * Check if application is installed
        * Update appplication
 */

module.exports.update = function(req, res, next) {
  var name;
  name = req.params.name;
  return controller.update(req.connection, name, function(err, result) {
    if (err != null) {
      log.error(err.toString());
      err = new Error(err.toString());
      return sendError(res, err, 400);
    } else {
      return res.send(200, {
        "drone": {
          "port": result.port
        }
      });
    }
  });
};


/*
    Update application
        * Check if application is installed
        * Update appplication
 */

module.exports.updateStack = function(req, res, next) {
  return async.eachSeries(['data-system', 'proxy', 'home'], function(app, callback) {
    return controller.stop(app, function(err, res) {
      if (err != null) {
        return callback(err);
      }
      return controller.update(req.connection, app, function(err, res) {
        return callback(err);
      });
    });
  }, function(err) {
    if (err != null) {
      log.error(err.toString());
      err = new Error("Cannot update stack : " + (err.toString()));
      return sendError(res, err, 400);
    } else {
      return updateController(0, function(err) {
        if (err != null) {
          log.error(err.toString());
          err = new Error("Cannot update stack : " + (err.toString()));
          return sendError(res, err, 400);
        } else {
          return res.send(200);
        }
      });
    }
  });
};


/*
    Reboot controller
 */

module.exports.restartController = function(req, res, next) {
  return restartController(function(err) {
    if (err != null) {
      log.error(err.toString());
      err = new Error(err.toString());
      return sendError(res, err, 400);
    } else {
      return res.send(200, {});
    }
  });
};


/*
    Return a list with all applications
 */

module.exports.all = function(req, res, next) {
  return controller.all(function(err, result) {
    if (err != null) {
      log.error(err.toString());
      err = new Error(err.toString());
      return sendError(res, err, 400);
    } else {
      return res.send(200, {
        app: result
      });
    }
  });
};


/*
    Return a list with all started applications
 */

module.exports.running = function(req, res, next) {
  return controller.running(function(err, result) {
    if (err != null) {
      log.error(err.toString());
      err = new Error(err.toString());
      return sendError(res, err, 400);
    } else {
      return res.send(200, {
        app: result
      });
    }
  });
};
