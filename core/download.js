/**
 * download.js - Entry point of the RemineGuard application for weekly reporting
 *               Downloads all issues (closed and still open)
 */


// Import dependencies
var util = require('util');
var config = require('./config.js');
var xhr = require('./ajax.js');
var fs = require('fs');

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

var creation_date = dateFormat (new Date (), "%Y-%m-%d_%Hh%Mm%S", true);
var outputFilename = './'+creation_date+'_issues.json';

function export_file(downloaded_issues) {
    //  "2012-05-18_05h37m21"

    fs.writeFile(outputFilename, JSON.stringify(downloaded_issues, null, 4), function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("JSON saved to "+outputFilename);
        }
    });
}

// GLOBAL VARIABLES
var issues = {total_count: -1, issues: []};
var base_url = config.redmine_url + 'issues.json?limit=100&status_id=*&project_id=' + config.redmine_project;
var myArgs = process.argv.slice(2);
var j = 0;

while(j<myArgs.length) {
    switch (myArgs[j++]) {
        case '-f':
            console.log('Create file : ' + myArgs[j]);
            outputFilename = myArgs[j++];
            break;
        default:
            console.log('Unknown parameter');
    }
}

// launch all issues downloading
download_all_issues(base_url, 0, config.redmine_key, issues, export_file, function(err){
    util.log("[ERROR] [main.js] " + err);
    process.exit(1);
});
