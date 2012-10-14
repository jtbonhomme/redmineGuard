
// Import dependencies
var util = require('util');
var irc = require('irc');
var config = require('./config.js');
var XMLHttpRequest = require("./XMLHttpRequest.js").XMLHttpRequest;
var xhr = new XMLHttpRequest();

// Create irc client object (also perform 'join') since autoRejoin and
// autoConnect are by default set to 'true' in config.options
var client = new irc.Client(config.irc_server, config.irc_nickname, config.irc_options);

// Check client is created
if( !client ) {
	util.log("[ERROR] irc client has not been created, exit.");
	process.exit(1);
}

// Listen for messages from irc server
client.addListener('message', function (from, to, message) {
    util.log(from + ' => ' + to + ': ' + message);
});

// download issues of the day from redmine
xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            util.log("Remine request completed. Body length: " + this.responseText.length);
            var issues = JSON.parse(this.responseText);
            util.log("Downloaded : " + issues.total_count + " issues.");
        }
};

// build redmine request
var issues_request =    config.redmine_url + 
                        'issues.json?project_id=' + 
                        config.redmine_project;

// open Ajax connexion
util.log("About to send AJAX request to redmine server : " + config.redmine_url);
xhr.open("GET", issues_request);
// include header with secret redmine API KEY
xhr.setRequestHeader("X-Redmine-API-Key",config.redmine_key);
// Send request
xhr.send();