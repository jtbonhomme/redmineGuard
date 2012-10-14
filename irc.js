
// Import dependencies
var irc = require('irc');
var config = require('./config.js');

// Create irc client object (also perform 'join')
var client = new irc.Client(config.server, config.nickname, config.options);

// Check client is created
if( !client ) {
	console.log("[ERROR] irc client has not been created, exit.")
	process.exit(1);
}

// Listen for messages from irc server
client.addListener('message', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
});

client.addListener('pm', function (from, message) {
    console.log(from + ' => ME: ' + message);
	client.say('jtb', "I'm a bot!");	
});

client.addListener('registered', function (message) {
    console.log('Registered => ME: ' + message);
});

client.addListener('join', function (channel, nick, message) {
    console.log(nick + ' joined ' + channel + ' => ME: ' + message);
});
