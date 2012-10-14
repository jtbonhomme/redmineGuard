
/*
    irc.js - Node JS IRC client
    
    This library is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this library.  If not, see <http://www.gnu.org/licenses/>.
*/

// Import dependencies
var util = require('util');
var config = require('./config.js');

// import irc node module
var irc = require('irc');

// import AJAX node module
var XMLHttpRequest = require("./XMLHttpRequest.js").XMLHttpRequest;
var xhr = new XMLHttpRequest();

// check_categories

function check_categories(downloaded_issues) {
    var i;
    var error_count = 0;

    if( !downloaded_issues ) {
        util.log("[ERROR] No issue were downloaded ...");
        return 1;
    }

    for(i=0; i < downloaded_issues.total_count; i++) {
        if( typeof downloaded_issues.issues[i] !== "undefined" ) {
            if( typeof downloaded_issues.issues[i].category === "undefined" ) {
                util.log("ISSUE #" + downloaded_issues.issues[i].id+ " categories is empty");
                error_count++;
            }
        }
    }

    return error_count;
}

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
    var error_count = 0;
    if (this.readyState == 4) {
        util.log("Remine request completed. Body length: " + this.responseText.length);
        var issues = JSON.parse(this.responseText);
        util.log("Downloaded : " + issues.total_count + " issues.");
        error_count = check_categories(issues);
        util.log("There are : " + error_count + " malformed issues.");
        process.exit(error_count);
    }
};

// build redmine request for the first 100 issues
var issues_request =    config.redmine_url + 
                        'issues.json?limit=100&project_id=' + 
                        config.redmine_project;

// open Ajax connexion
util.log("About to send AJAX request to redmine server : " + config.redmine_url);

xhr.open("GET", issues_request);
// include header with secret redmine API KEY
xhr.setRequestHeader("X-Redmine-API-Key",config.redmine_key);
// Send request
xhr.send();
