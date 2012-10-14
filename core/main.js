/**
 * main.js - Entry point of the RemineGuard application
 */


// Import dependencies
var util = require('util');
var config = require('./config.js');
var xhr = require('./ajax.js');
var irc = require('./irc.js');

// connect to irc server
var irc_client = irc.client(config.irc_server, config.irc_nickname, config.irc_options, function(from, to, message){
    util.log(from + " to " + to + ": " + message);
});

// check_categories
function check_categories(downloaded_issues) {
    var i;
    var error_count = 0;
    if( !downloaded_issues ) {
        util.log("[ERROR] [Main.js] No issue were downloaded ...");
        process.exit(1);
    }
    for(i=0; i < downloaded_issues.total_count; i++) {
        if( typeof downloaded_issues.issues[i] !== "undefined" ) {
            if( typeof downloaded_issues.issues[i].category === "undefined" ) {
                //util.log("[Main.js] ISSUE #" + downloaded_issues.issues[i].id+ " categories is empty");
                error_count++;
            }
        }
    }
    util.log("[Main.js] There are : " + error_count + " malformed issue(s)");
    irc_client.say(config.irc_options.channels[0], "[Main.js] There are : " + error_count + " malformed issue(s)");
    //process.exit(error_count);
}

function download_all_issues(url, offset, key, all_issues, success, error) {
    this.url=url;
    this.offset = offset;
    this.key=key;
    xhr.ajax(this.url +"&offset=" + this.offset, this.key, function(data) {
        all_issues.total_count = data.total_count;
        all_issues.issues = all_issues.issues.concat(data.issues);
        var next_offset = all_issues.issues.length;
        if (all_issues.issues.length < all_issues.total_count) {
            download_all_issues(this.url, next_offset, this.key, all_issues, success, error);
        }
        else {
            success(all_issues);
        }
    }, function(err) { error(err); });

}

var issues = {total_count: -1, issues: []};
var base_url = config.redmine_url + 'issues.json?limit=100&project_id=' + config.redmine_project;

download_all_issues(base_url, 0, config.redmine_key, issues, check_categories, function(err){
    util.log("[ERROR] [main.js] " + err);
    process.exit(1);
});

