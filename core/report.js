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
    "motherless_tasks": []
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

function getTasks(all_issues){
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
        }
    }
}

function report(all_issues) {
    getVersionsAndStories(all_issues);
    getTasks(all_issues);


    // test
    var i;
    for( i=0; i<backlog_report.versions.length; i++ ) {
        console.log("["+i+"] report: versions: " + backlog_report.versions[i]);
    }

    backlog_report.stories.forEach(function(element, index){
        console.log("["+index+"] report: stories: #" + element.story.id + " : " + element.story.subject);
        element.tasks.forEach(function(element, index){
            console.log("\t> report: tasks: #" + element.id + " : " + element.subject);
        });
    });
}

function open_file(filename, downloaded_issues, callback) {
    console.log("Open "+ filename);
    fs.readFile(filename, function (err, data) {
        if (err) {
            console.log("ERROR ");
            throw err;
        }
        downloaded_issues = JSON.parse(data);
        callback(downloaded_issues);
    });
}

var issues = {};

// launch all issues downloading
open_file("2012-10-26_16h13m07_issues.json", issues, report);
