/**
 * main.js - Entry point of the RemineGuard application
 */


// Import dependencies
var util = require('util');
var config = require('./config.js');
var xhr = require('./ajax.js');
var irc = require('./irc.js');

// check_categories
function check_categories(downloaded_issues) {
    var i;
    var error_count = 0;
    if( !downloaded_issues ) {
        util.log("[ERROR] [Main.js] No issue were downloaded ...");
        return 1;
    }
    for(i=0; i < downloaded_issues.total_count; i++) {
        if( typeof downloaded_issues.issues[i] !== "undefined" ) {
            if( typeof downloaded_issues.issues[i].category === "undefined" ) {
                util.log("[Main.js] ISSUE #" + downloaded_issues.issues[i].id+ " categories is empty");
                error_count++;
            }
        }
    }
    return error_count;
}

var client = irc.client(config.irc_server, config.irc_nickname, config.irc_options, function(from, to, message){
    util.log(from + " to " + to + ": " + message);
});

var url = config.redmine_url + 'issues.json?limit=100&project_id=' + config.redmine_project;
var issues = xhr.ajax(url, config.redmine_key, function(data) {
    util.log("[Main.js] Downloaded : " + data.total_count + " issues.");
    var error_count = check_categories(data);
    util.log("[Main.js] There are : " + error_count + " malformed issues.");
    process.exit(error_count);
}, function(err) {
    util.log("[Main.js] exit: " + err);
    process.exit(1);
});