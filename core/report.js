/**
 * report.js - Entry point of the RemineGuard application for weekly reporting
 */


// Import dependencies
var util = require('util');
var fs = require('fs');
var backlog_report = {
    "stories":[ {
        "story":{},
        "tasks":[]
    }],
    "versions": [],
    "motherless_tasks": [],
    "remaining_time_track": {
        "restapi": 0,
        "testapp": 0,
        "webapp": 0,
        "mw": 0
    },
    "closed_tasks": {
        "restapi": 0,
        "testapp": 0,
        "webapp": 0,
        "mw": 0
    },
    "total_tasks": {
        "restapi": 0,
        "testapp": 0,
        "webapp": 0,
        "mw": 0
    }
};

function getVersionsAndStories(all_issues){
    var i;
    // parse all issues
    for(i=0; i<all_issues.total_count; i++) {
        // if issue is a "story" "spike" or "defect"
        if( all_issues.issues[i].tracker.name === "User Story" ||
            all_issues.issues[i].tracker.name === "Technical Story" ||
            all_issues.issues[i].tracker.name === "Defect" ||
            all_issues.issues[i].tracker.name === "Spike") {
            // store it
            backlog_report.stories[all_issues.issues[i].id] = { story:all_issues.issues[i], tasks:[] };
            //console.log("Story #"+backlog_report.stories[all_issues.issues[i].id].story.id+" is stored");
        }
        // if this issue has a version that has never been recorded, add it to an array
        if( typeof all_issues.issues[i].fixed_version !== "undefined" ) {
            if (backlog_report.versions.indexOf( all_issues.issues[i].fixed_version.name ) == -1 ) {
                backlog_report.versions.push(all_issues.issues[i].fixed_version.name);
            }
        }
    }
}

function getTasks(all_issues, version){
    var i;
    // parse all issues
    for(i=0; i<all_issues.total_count; i++) {
        // if issue is a "task"
        if( all_issues.issues[i].tracker.name === "Task") {
            // store it in its parent's story if it exists
            if( typeof all_issues.issues[i].parent != "undefined") {
                // Optimistic mode: assume that all story already have been recorded
                if( typeof backlog_report.stories[all_issues.issues[i].parent.id] !== "undefined" ) {
                    //console.log("Parent of task #"+all_issues.issues[i].id+" is story #"+all_issues.issues[i].parent.id+" SUBJECT: "+ backlog_report.stories[all_issues.issues[i].parent.id].story.subject);
                    backlog_report.stories[all_issues.issues[i].parent.id].tasks.push(all_issues.issues[i]);
                }
                else {
                    //console.log("Parent of task #"+all_issues.issues[i].id+" is story #"+all_issues.issues[i].parent.id+" ** UNDEFINED ** ");
                    backlog_report.motherless_tasks.push(all_issues.issues[i]);
                }

            }
            else {
                // no parent task found
                //console.log("Task #"+all_issues.issues[i].id+" has no parent !");
                backlog_report.motherless_tasks.push(all_issues.issues[i]);
            }

            // and update time_tracking according to assigned user
            // {"name":"New","id":1},
            // {"name":"Ready","id":2},
            // {"name":"On-going","id":3},
            // {"name":"To-be-tested","id":4},
            // {"name":"Completed","id":6},
            // {"name":"Verified","id":8},
            // {"name":"Delivered","id":7},
            // {"name":"Waiting","id":10},
            // {"name":"Done","id":5,"is_closed":true},
            // {"name":"Terminated","id":9,"is_closed":true}]}

            if( typeof all_issues.issues[i].assigned_to !== "undefined" ) {
                switch( all_issues.issues[i].assigned_to.name ) {
                    case "WEBAPP":
                        backlog_report.total_tasks.webapp += 1;
                        break;
                    case "API REST":
                        backlog_report.total_tasks.restapi += 1;
                        break;
                    case "TESTAPP":
                        backlog_report.total_tasks.testapp += 1;
                        break;
                    default:
                        backlog_report.total_tasks.mw += 1;
                        break;
                }
                if( typeof all_issues.issues[i].fixed_version !== "undefined") {
                    if( all_issues.issues[i].status.id != 5 &&
                        all_issues.issues[i].status.id != 9 &&
                        all_issues.issues[i].fixed_version.name === version) {
                        switch( all_issues.issues[i].assigned_to.name ){
                            case "WEBAPP":
                                backlog_report.remaining_time_track.webapp += all_issues.issues[i].estimated_hours;
                                if( typeof all_issues.issues[i].estimated_hours !== "undefined" ) {
                                    backlog_report.remaining_time_track.webapp += all_issues.issues[i].estimated_hours;
                                }
                                break;
                            case "API REST":
                                backlog_report.remaining_time_track.restapi += all_issues.issues[i].estimated_hours;
                                if( typeof all_issues.issues[i].estimated_hours !== "undefined" ) {
                                    backlog_report.remaining_time_track.restapi += all_issues.issues[i].estimated_hours;
                                }
                                break;
                            case "TESTAPP":
                                backlog_report.remaining_time_track.testapp += all_issues.issues[i].estimated_hours;
                                if( typeof all_issues.issues[i].estimated_hours !== "undefined" ) {
                                    backlog_report.remaining_time_track.testapp += all_issues.issues[i].estimated_hours;
                                }
                                break;
                            default:
                                backlog_report.remaining_time_track.mw += all_issues.issues[i].estimated_hours;
                                if( typeof all_issues.issues[i].estimated_hours !== "undefined" ) {
                                    backlog_report.remaining_time_track.mw += all_issues.issues[i].estimated_hours;
                                }
                                break;
                        }
                    }
                    else if( ( all_issues.issues[i].status.id == 5 ||
                               all_issues.issues[i].status.id == 9 ) &&
                             ( all_issues.issues[i].fixed_version.name === version ) ) {
                        switch( all_issues.issues[i].assigned_to.name ){
                            case "WEBAPP":
                                backlog_report.closed_tasks.webapp += all_issues.issues[i].estimated_hours;
                                break;
                            case "API REST":
                                backlog_report.closed_tasks.restapi += all_issues.issues[i].estimated_hours;
                                break;
                            case "TESTAPP":
                                backlog_report.closed_tasks.testapp += all_issues.issues[i].estimated_hours;
                                break;
                            default:
                                backlog_report.closed_tasks.mw += all_issues.issues[i].estimated_hours;
                                break;
                        }
                    }
 
                }
            } // end if assigned_to is not undefined
        }
    }
}

function report(all_issues, version) {
    getVersionsAndStories(all_issues);
    getTasks(all_issues, version);

    console.log("REPORT FOR VERSION "+version);
    // test
    var i;
/*    for( i=0; i<backlog_report.versions.length; i++ ) {
        console.log("["+i+"] report: versions: " + backlog_report.versions[i]);
    }

    backlog_report.stories.forEach(function(element, index){
        console.log("["+index+"] report: stories: #" + element.story.id + " : " + element.story.subject);
        element.tasks.forEach(function(element, index){
            console.log("\t> report: tasks: #" + element.id + " : " + element.subject);
        });
    });
*/
    console.log("Estimated remaining time for :");
    console.log("- WEBAPP is " + backlog_report.remaining_time_track.webapp + " hours" );
    console.log("- API REST is " + backlog_report.remaining_time_track.restapi + " hours" );
    console.log("- TESTAPP is " + backlog_report.remaining_time_track.testapp + " hours" );
    console.log("- MIDDLEWARE is " + backlog_report.remaining_time_track.mw + " hours" );

    console.log("Total tasks for :");
    console.log("- WEBAPP is " + backlog_report.total_tasks.webapp);
    console.log("- API REST is " + backlog_report.total_tasks.restapi);
    console.log("- TESTAPP is " + backlog_report.total_tasks.testapp);
    console.log("- MIDDLEWARE is " + backlog_report.total_tasks.mw);

    console.log("Closed for :");
    console.log("- WEBAPP is " + backlog_report.closed_tasks.webapp);
    console.log("- API REST is " + backlog_report.closed_tasks.restapi);
    console.log("- TESTAPP is " + backlog_report.closed_tasks.testapp);
    console.log("- MIDDLEWARE is " + backlog_report.closed_tasks.mw);
}

function open_file(filename, downloaded_issues, callback, version) {
    console.log("Open "+ filename);
    fs.readFile(filename, function (err, data) {
        if (err) {
            console.log("ERROR ");
            throw err;
        }
        downloaded_issues = JSON.parse(data);
        callback(downloaded_issues, version);
    });
}

var issues = {};

// launch all issues downloading
open_file("2012-10-26_16h13m07_issues.json", issues, report, "Sprint 2 Lot 1");
