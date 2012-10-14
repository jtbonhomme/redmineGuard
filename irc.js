var msg = require('sys');
var irc = require('irc');
var client = new irc.Client('irc.wyplay.net', 'r7bot', {
    channels: ['#r7_redmine'],
    secure: true,
    selfSigned: true,
    certExpired: true,
    debug: true
});

console.log("start");

if( !client ) {
	console.log("[ERROR] irc client has not been created, exit.")
	return(-1);
}

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

console.log("This is the end");
return(0);