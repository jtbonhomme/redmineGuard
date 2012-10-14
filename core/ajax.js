/**
 * ajax.js - XMLHttpRequest helper
 *
 * Execute an Ajax request.
 * @param {str} url The url of the request
 * @param {str} key API Key
 * @param {function} callback The callback function called when the request succeeds. Used with data response of AJAX request, parsed as JSON as parameter.
 * @param {function} errorcallback The errorcallback function called when the request fails. Used with request as parameter.
 */

var XMLHttpRequest = require("./lib/XMLHttpRequest.js").XMLHttpRequest;

exports.ajax = function(url, key, callback, errorcallback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (xhr.responseText) {
                try {
                    data = JSON.parse(this.responseText);
                    callback(data);
                }
                catch (err) {
                    data = xhr.responseText;
                    errorcallback("[ERROR] [ajax.js] error parsing json: " + err + " " + err.lineNumber + " l." + err.fileName);
                }
            }
            else {
                if (errorcallback) {
                    errorcallback("responseText is empty");
                }
            }
        }
    };
    // open Ajax connexion
    xhr.open("GET", url);
    // include header with secret redmine API KEY
    xhr.setRequestHeader("X-Redmine-API-Key",key);
    // Send request
    xhr.send();
};

