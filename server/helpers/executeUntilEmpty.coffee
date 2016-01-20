sudo = require './sudo'

module.exports = executeUntilEmpty = (commands, config, callback) ->
    command = commands.shift()
    child = sudo config.user, config.cwd, command
    child.on 'close', (code) ->
        if code isnt 0
            callback new Error "#{command} failed with code #{code}"
        else if commands.length > 0
            executeUntilEmpty commands, config, callback
        else
            callback()
