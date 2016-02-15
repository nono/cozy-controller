// Generated by CoffeeScript 1.10.0
var config, controller, exec, findStartScript, forever, fs, log, path, prepareEnv, prepareForeverOptions, rotateLogFiles, setupLogFiles, setupLogging, setupSyslog, token;

forever = require('forever-monitor');

fs = require('fs');

path = require('path');

exec = require('child_process').exec;

token = require('../middlewares/token');

controller = require('../lib/controller');

log = require('printit')({
  date: true,
  prefix: 'lib:spawner'
});

config = require('../lib/conf').get;

prepareEnv = function(app) {
  var env, environment, i, j, key, len, len1, pwd, ref, ref1, ref2, ref3, ref4;
  if ((ref = app.name) === "home" || ref === "proxy" || ref === "data-system") {
    pwd = token.get();
  } else {
    pwd = app.password;
  }
  env = {
    NAME: app.name,
    TOKEN: pwd,
    USER: app.user,
    USERNAME: app.user,
    HOME: app.dir,
    NODE_ENV: process.env.NODE_ENV,
    APPLICATION_PERSISTENT_DIRECTORY: app.folder
  };
  if (process.env.DB_NAME != null) {
    env.DB_NAME = process.env.DB_NAME;
  }
  if ((ref1 = config("env")) != null ? ref1[app.name] : void 0) {
    environment = config("env")[app.name];
    ref2 = Object.keys(environment);
    for (i = 0, len = ref2.length; i < len; i++) {
      key = ref2[i];
      env[key] = environment[key];
    }
  }
  if ((ref3 = config("env")) != null ? ref3.global : void 0) {
    environment = config("env").global;
    ref4 = Object.keys(environment);
    for (j = 0, len1 = ref4.length; j < len1; j++) {
      key = ref4[j];
      env[key] = environment[key];
    }
  }
  return env;
};

prepareForeverOptions = function(app, env) {
  var foreverOptions;
  foreverOptions = {
    fork: true,
    silent: true,
    max: 5,
    stdio: ['ipc', 'pipe', 'pipe'],
    cwd: app.dir,
    logFile: app.logFile,
    env: env,
    killTree: true,
    killTTL: 0,
    command: 'node'
  };
  foreverOptions.args = ['--plugin', 'net', '--plugin', 'setgid', '--setgid', app.user, '--plugin', 'setgroups', '--setgroups', app.user, '--plugin', 'setuid', '--setuid', app.user];
  if (app.name === "proxy") {
    foreverOptions.args = foreverOptions.args.concat(['--bind_ip', config('bind_ip_proxy')]);
  }
  return foreverOptions;
};

findStartScript = function(app, callback) {
  return fs.readFile(app.dir + "/package.json", 'utf8', function(err, data) {
    var args, error, isCoffee, ref, start;
    try {
      data = JSON.parse(data);
    } catch (error) {
      return callback(new Error("Package.json isn't in a correct format."));
    }
    isCoffee = false;
    args = [];
    if (((ref = data.scripts) != null ? ref.start : void 0) != null) {
      start = data.scripts.start.split(' ');
      app.startScript = path.join(app.dir, start[1]);
      if (start[0] === 'coffee') {
        isCoffee = true;
      }
      args = start.slice(2);
    }
    if (!start) {
      isCoffee = path.extname(app.server) === '.coffee';
    }
    return fs.stat(app.startScript, function(err, stats) {
      return callback(err, isCoffee, args);
    });
  });
};

rotateLogFiles = function(app) {
  if (fs.existsSync(app.logFile)) {
    app.backup = app.logFile + "-backup";
    if (fs.existsSync(app.backup)) {
      fs.unlinkSync(app.backup);
    }
    fs.renameSync(app.logFile, app.backup);
  }
  if (fs.existsSync(app.errFile)) {
    app.backupErr = app.errFile + "-backup";
    if (fs.existsSync(app.backupErr)) {
      fs.unlinkSync(app.backupErr);
    }
    return fs.renameSync(app.errFile, app.backupErr);
  }
};

setupLogFiles = function(app, foreverOptions) {
  var close, start;
  rotateLogFiles(app);
  foreverOptions.outFile = app.logFile;
  foreverOptions.errFile = app.errFile;
  start = function(monitor) {
    return monitor.child.stderr.pipe(monitor.stdout, {
      end: false
    });
  };
  close = function(monitor) {
    var base;
    if (typeof (base = monitor.child.stderr).unpipe === "function") {
      base.unpipe(monitor.stdout);
    }
    return rotateLogFiles(app);
  };
  return {
    start: start,
    close: close
  };
};

setupSyslog = function(app, foreverOptions) {
  var Syslogger, close, host, logger, port, sendLog, start;
  Syslogger = require('ain2');
  host = process.env.SYSLOG_HOST || 'localhost';
  port = process.env.SYSLOG_PORT || 514;
  logger = new Syslogger({
    hostname: host,
    port: port
  });
  sendLog = function(data) {
    var severity;
    data = data.toString();
    if (data !== ' ' && data !== '\n') {
      severity = (function() {
        switch (data.slice(0, 6)) {
          case 'error:':
            return 'err';
          case 'warn: ':
            return 'warn';
          case 'info: ':
            return 'info';
          case 'debug:':
            return 'debug';
          default:
            return 'notice';
        }
      })();
      return logger.send(data, severity);
    }
  };
  start = function(monitor) {
    logger.setMessageComposer(function(message, severity) {
      return new Buffer('<' + (this.facility * 8 + severity) + '>' + this.getDate() + ' ' + app.name + '[' + monitor.childData.pid + ']:' + message);
    });
    monitor.on('stdout', sendLog);
    return monitor.on('stderr', sendLog);
  };
  close = function(monitor) {
    monitor.removeListener('stdout', sendLog);
    return monitor.removeListener('stderr', sendLog);
  };
  return {
    start: start,
    close: close
  };
};

setupLogging = function(app, foreverOptions) {
  if (process.env.USE_SYSLOG) {
    return setupSyslog(app, foreverOptions);
  } else {
    return setupLogFiles(app, foreverOptions);
  }
};


/*
    Start application <app> with forever-monitor and carapace
 */

module.exports.start = function(app, callback) {
  var env, foreverOptions, logging, result;
  result = {};
  env = prepareEnv(app, env);
  foreverOptions = prepareForeverOptions(app);
  logging = setupLogging(app, foreverOptions);
  return findStartScript(app, function(err, isCoffee, foreverArgs) {
    var carapaceBin, monitor, onError, onExit, onPort, onRestart, onStart, onTimeout, respond, responded, timeout, updateResult;
    if (err) {
      return callback(err);
    } else {
      if (isCoffee) {
        foreverOptions.args = foreverOptions.args.concat(['--plugin', 'coffee']);
      }
      foreverOptions.args.push(app.startScript);
      foreverOptions.args = foreverOptions.args.concat(foreverArgs);
      carapaceBin = path.join(require.resolve('cozy-controller-carapace'), '..', '..', 'bin', 'carapace');
      monitor = new forever.Monitor(carapaceBin, foreverOptions);
      responded = false;
      respond = function(err, result) {
        if (!responded) {
          responded = true;
          monitor.removeListener('exit', onExit);
          monitor.removeListener('error', onError);
          monitor.removeListener('message', onPort);
          clearTimeout(timeout);
          return callback(err, result);
        }
      };
      onExit = function() {
        logging.close(monitor);
        log.error('Callback on Exit');
        if (callback) {
          return respond(new Error(app.name + " CANT START"));
        } else {
          log.error(app.name + " HAS FAILED TOO MUCH");
          return setTimeout((function() {
            return monitor.exit(1);
          }), 1);
        }
      };
      onError = function(err) {
        return respond(err.toString());
      };
      updateResult = function(monitor, data) {
        logging.start(monitor);
        return result = {
          monitor: monitor,
          process: monitor.child,
          data: data,
          pid: monitor.childData.pid,
          pkg: app,
          logging: logging
        };
      };
      onStart = function(monitor, data) {
        updateResult(monitor, data);
        return log.info(app.name + ": start with pid " + result.pid);
      };
      onRestart = function(monitor, data) {
        updateResult(monitor, data);
        return log.info(app.name + ": restart with pid " + result.pid);
      };
      onTimeout = function() {
        monitor.removeListener('exit', onExit);
        monitor.stop();
        controller.removeRunningApp(app.name);
        log.error('callback timeout');
        return respond(new Error('Error spawning application'));
      };
      onPort = function(info) {
        if ((info != null ? info.event : void 0) === 'port') {
          result.port = info.data.port;
          return respond(null, result);
        }
      };
      monitor.start();
      monitor.once('exit', onExit);
      monitor.once('error', onError);
      monitor.once('start', onStart);
      monitor.on('restart', onRestart);
      monitor.on('message', onPort);
      return timeout = setTimeout(onTimeout, 8000000);
    }
  });
};
