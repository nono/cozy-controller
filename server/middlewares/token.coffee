token = ""

###
    Initalise token in RAM
###
module.exports.init = (current_token) ->
    token = current_token

###
    Check if request in authenticated:
        * Return 401 as error code if request hasn't a token
        * return 403 as error code if token is bad
        * Continue if token is correct
###
module.exports.check = (req, res, next) ->
    if process.env.NODE_ENV is "production" or process.env.NODE_ENV is "test"
        auth = req.headers['x-auth-token']
        console.log "check token:", auth, token
        if auth isnt "undefined" and auth?
            if auth isnt token
                res.status(401).send "Token is not correct"
            else
                next()
        else
            res.status(401).send "Application is not authenticated"
    else
        next()

###
    Return token
        Useful in spawner to transmit token to stack application
###
module.exports.get = ->
    return token
