/**
 * report.js - Entry point of the RemineGuard application for weekly reporting
 */


// Import dependencies
var util = require('util');
var config = require('./config.js');
var xhr = require('./ajax.js');


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
    return error_count;
}

// check_categories
/*
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
    return error_count;
}
*/

function parse_issues(issue_db, issues_to_parse) {
    var i;
    // parse a first time to get all stories
    for(i=0; i < issues_to_parse.issues.length; i++) {
        if( (issues_to_parse.issues[i].tracker.name === "User Story") ||
            (issues_to_parse.issues[i].tracker.name === "Technical Story") ||
            (issues_to_parse.issues[i].tracker.name === "Spike") ||
            (issues_to_parse.issues[i].tracker.name === "Defect")) {
            issue_db.stories.push( { 
                "id": issues_to_parse.issues[i].id,
                "tracker_name": issues_to_parse.issues[i].tracker.name,
                "subject": issues_to_parse.issues[i].subject,
                "author": issues_to_parse.issues[i].author,
                "author": issues_to_parse.issues[i].author,
                "assigned_to": ((typeof issues_to_parse.issues[i].assigned_to === "undefined") ? "none" : issues_to_parse.issues[i].assigned_to.name),
        }
        issues_to_parse.issues[i].id =
            "fixed_version_name": ((typeof issues_to_parse.issues[i].fixed_version === "undefined") ? "none" : issues_to_parse.issues[i].fixed_version.name)
        console.log("#"+issues_to_parse.issues[i].id+" "+issues_to_parse.issues[i].tracker.name + " category " + );
   }
}

function download_all_issues(url, offset, key, all_issues, success, error) {
    this.url=url;
    this.offset = offset;
    this.key=key;
    util.print(".");
    xhr.ajax(this.url +"&offset=" + this.offset, this.key, function(data) {
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

function dateFormat (date, fstr, utc) {
  utc = utc ? 'getUTC' : 'get';
  return fstr.replace (/%[YmdHMS]/g, function (m) {
    switch (m) {
    case '%Y': return date[utc + 'FullYear'] (); // no leading zeros required
    case '%m': m = 1 + date[utc + 'Month'] (); break;
    case '%d': m = date[utc + 'Date'] (); break;
    case '%H': m = date[utc + 'Hours'] (); break;
    case '%M': m = date[utc + 'Minutes'] (); break;
    case '%S': m = date[utc + 'Seconds'] (); break;
    default: return m.slice (1); // unknown code, remove %
    }
    // add leading zero if required
    return ('0' + m).slice (-2);
  });
}

/*
 issue_db: {
    "creation_date":string,
    "versions" : [
    {
        "version": string,
        "stories": [
        {
            "id": number,
            "tracker_name": string,
            "subject": string,
            "status":string,
            "author":string,
            "assigned_to":string,
            "tasks": [
                "task_id":number,
                "assigned_to":string,
                "status": string,
                "subject": string,
                "estimated_time":number,
                "to_do":number
            ]
        }]
    }]
 }
 */

function report(downloaded_issues) {
    var issue_db = {
         "creation_date":"",
        "stories": []
    };
    //  "2012-05-18 05:37:21"
    issue_db.creation_date = dateFormat (new Date (), "%Y-%m-%d %H:%M:%S", true);

    // get all issues and store in json db object
    parse_issues(issue_db, downloaded_issues);
}

var issues = {total_count: -1, issues: []};
var base_url = config.redmine_url + 'issues.json?limit=100&project_id=' + config.redmine_project;

// launch all issues downloading
download_all_issues(base_url, 0, config.redmine_key, issues, report, function(err){
    util.log("[ERROR] [main.js] " + err);
    process.exit(1);
});
