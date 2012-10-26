/**
 * check.js - Entry point of the RemineGuard application for checking issues
 */


// Import dependencies
var util = require('util');
var config = require('./config.js');
var xhr = require('./ajax.js');
//var irc = require('./irc.js');
var hash_issues = [];

function update_log(filename, message) {

  var now = new Date();
  var dateAndTime = now.toUTCString();
  stream = fs.createWriteStream(filename, {
    'flags': 'a+',
    'encoding': 'utf8',
    //'mode': 0644
    'mode': 644
  });

  stream.write(dateAndTime + " ", 'utf8');
  stream.write(message + ": ", 'utf8');
  stream.end();
}

// connect to irc server
var irc_client = irc.client(config.irc_server, config.irc_nickname, config.irc_options, function(from, to, message){
    util.log(from + " to " + to + ": " + message);
});


// check_categories
function check_categories(downloaded_issues) {
    var i;
    var error_count = 0;
    var error_label = "";
    if( !downloaded_issues ) {
        util.log("[ERROR] [Main.js] No issue were downloaded ...");
        process.exit(1);
    }
    for(i=0; i < downloaded_issues.total_count; i++) {
        if( typeof downloaded_issues.issues[i] !== "undefined" ) {
            if( typeof downloaded_issues.issues[i].category === "undefined" ) {
                //util.log("[Main.js] ISSUE #" + downloaded_issues.issues[i].id+ " categories is empty");
                util.log( "Issue #" + downloaded_issues.issues[i].id +
                            " does not have a valid CATEGORY field ("+ config.redmine_url + "issues/" +
                            downloaded_issues.issues[i].id + ")");
                error_count++;
            }
        }
    }
    error_label = "[CATEGORY CHECKING] There are : " + error_count + " malformed issue(s) over " + i + " issues parsed";
    //util.log("[Main.js] " + error_label);
    irc_client.say(config.irc_options.channels[0], error_label);
    return error_count;
}

// check_categories
function check_task_parent(downloaded_issues) {
    var i;
    var error_count = 0;
    var error_label = "";
    if( !downloaded_issues ) {
        util.log("[ERROR] [Main.js] No issue were downloaded ...");
        process.exit(1);
    }
    for(i=0; i < downloaded_issues.total_count; i++) {
        if( typeof downloaded_issues.issues[i] !== "undefined" ) {
            // check if tasks have a parent (no orphelin tasks that will not be tracked in Redmine)
            if( ( typeof downloaded_issues.issues[i].parent === "undefined" ) &&
                ( downloaded_issues.issues[i].tracker.name === "Task" ) )  {
                //util.log("[Main.js] ISSUE #" + downloaded_issues.issues[i].id+ " categories is empty");
                util.log( "Issue #" + downloaded_issues.issues[i].id +
                            " is a Task and does not have a valid PARENT field ("+ config.redmine_url + "issues/" +
                            downloaded_issues.issues[i].id + ")");
                error_count++;
            }
        }
    }
    error_label = "[TASK PARENT CHECKING] There are : " + error_count + " malformed issue(s) over " + i + " issues parsed";
    //util.log("[Main.js] " + error_label);
 //   irc_client.say(config.irc_options.channels[0], error_label);
    return error_count;
}

// check_categories
function check_parents_category(downloaded_issues) {
    var i;
    var error_count = 0;
    var error_label = "";
    if( !downloaded_issues ) {
        util.log("[ERROR] [Main.js] No issue were downloaded ...");
        process.exit(1);
    }
    for(i=0; i < downloaded_issues.total_count; i++) {
        if( typeof downloaded_issues.issues[i] !== "undefined" ) {
            // check if tasks have a parent (no orphelin tasks that will not be tracked in Redmine)
            if( (typeof downloaded_issues.issues[i].parent !== "undefined") &&
                (typeof downloaded_issues.issues[i].category !== "undefined") ) {
                var parent_id = downloaded_issues.issues[i].parent.id;
                if( hash_issues[parent_id].category_name !== "none" ) {
                    if( hash_issues[parent_id].category_name !== downloaded_issues.issues[i].category.name ) {
                        util.log( "Issue #" + downloaded_issues.issues[i].id +
                                    " has not the same CATEGORY ("+downloaded_issues.issues[i].category.name+") than its PARENT:"+hash_issues[parent_id].category_name+" ("+ config.redmine_url + "issues/" +
                                    downloaded_issues.issues[i].id + ")");
                        error_count++;
                    }
                }
            }
        }
    }
    error_label = "[PARENT CATEGORY CHECKING] There are : " + error_count + " malformed issue(s) over " + i + " issues parsed";
    //util.log("[Main.js] " + error_label);
    irc_client.say(config.irc_options.channels[0], error_label);
    return error_count;
}


function parse_issues(hash_to_fill, issues_to_parse) {
    var i;
    for(i=0; i < issues_to_parse.issues.length; i++) {
        hash_to_fill[issues_to_parse.issues[i].id]={
            "tracker_name": issues_to_parse.issues[i].tracker.name,
            "status_name": ((typeof issues_to_parse.issues[i].status === "undefined") ? "none" : issues_to_parse.issues[i].status.name),
            "fixed_version_name": ((typeof issues_to_parse.issues[i].fixed_version === "undefined") ? "none" : issues_to_parse.issues[i].fixed_version.name)
        };
        //console.log("#"+issues_to_parse.issues[i].id+" "+issues_to_parse.issues[i].tracker.name + " category " + hash_to_fill[issues_to_parse.issues[i].id].category + " parent " + hash_to_fill[issues_to_parse.issues[i].id].parent_id);
   }
}

function download_all_issues(url, offset, key, all_issues, success, error) {
    this.url=url;
    this.offset = offset;
    this.key=key;
    util.print(".");
    xhr.ajax(this.url +"&offset=" + this.offset, this.key, function(data) {
        parse_issues(hash_issues, data);
        all_issues.total_count = data.total_count;
        all_issues.issues = all_issues.issues.concat(data.issues);
        var next_offset = all_issues.issues.length;
        if (all_issues.issues.length < all_issues.total_count) {
            download_all_issues(this.url, next_offset, this.key, all_issues, success, error);
        }
        else {
            util.print("\n");
            success(all_issues);
        }
    }, function(err) { error(err); });
}

function perform_tests(downloaded_issues){
    var error_count=0;

    // pass tests
    error_count += check_categories(downloaded_issues);
    error_count += check_task_parent(downloaded_issues);
    error_count += check_parents_category(downloaded_issues);

    process.exit(error_count);
}

var issues = {total_count: -1, issues: []};
var base_url = config.redmine_url + 'issues.json?limit=100&project_id=' + config.redmine_project;

// launch all issues downloading
download_all_issues(base_url, 0, config.redmine_key, issues, perform_tests, function(err){
    util.log("[ERROR] [main.js] " + err);
    process.exit(1);
});
