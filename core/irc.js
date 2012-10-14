/**
 * irc.js - Node JS IRC client
 *
 * Connect to an IRC channel.
 * @param {str} server The server to connect
 * @param {str} nickname The bot nickname
 * @param {obj} options The connection options
 * @param {function} msg_callback The callback function called when a message is received.
 */
// import irc node module
var irc = require('irc');

exports.client = function(server, nickname, options, msg_callback) {
    // Create irc client object (also perform 'join') since autoRejoin and
    // autoConnect are by default set to 'true' in config.options
    var client = new irc.Client(server, nickname, options);

    // Check client is created
    if( client ) {
        // Listen for messages from irc server
        client.addListener('message', function (from, to, message) {
            // add code to handle messages
            msg_callback(from, to, message);
        });

        return client;
    }
};