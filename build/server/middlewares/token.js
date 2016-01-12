// Generated by CoffeeScript 1.10.0
var token;

token = "";


/*
    Initalise token in RAM
 */

module.exports.init = function(current_token) {
  return token = current_token;
};


/*
    Check if request in authenticated:
        * Return 401 as error code if request hasn't a token
        * return 403 as error code if token is bad
        * Continue if token is correct
 */

module.exports.check = function(req, res, next) {
  var auth;
  if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
    auth = req.headers['x-auth-token'];
    console.log("check token:", auth, token);
    if (auth !== "undefined" && (auth != null)) {
      if (auth !== token) {
        return res.status(401).send("Token is not correct");
      } else {
        return next();
      }
    } else {
      return res.status(401).send("Application is not authenticated");
    }
  } else {
    return next();
  }
};


/*
    Return token
        Useful in spawner to transmit token to stack application
 */

module.exports.get = function() {
  return token;
};
