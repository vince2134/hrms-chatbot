var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var mysql = require('./node_modules/mysql');
var trigger = require('./basetrigger');
var app = express();
//Connection for chatbot conversation using API.AI ***INSERT APIAI DASHBOARD URL HERE***
var apiai = require('apiai');
//API.AI Client Access Token
var app2 = apiai("b464d87b79f947bc9197a66b7ff346b2");
var globalSenderId;
//notifier - indicator used to know whether employees have already been notified
var notified = false;
var register = false;
var intent = "";
//FB Page Access Token
var token = "EAAaA4LJeypQBABay9GkjkbF02ri0qx218cby6M3q6ZBGri2qzm9J1XZBIVgxFcRvBpoZCinySRcptTrACfJEki0e9XXMqDMr83Hc5ZBkAX3LNW1p4yPGpiAeyeoZCVCqVK2LyOOCZA53zpV8WXrQZB7mV0gC7PfNyrNRw6sCIikNAZDZD";
var https = require('https');
var http = require('http');
var fs = require('fs');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// Function that ticks every 1 second.
console.log("Start Timer");
var myVar = setInterval(function() {
    myTimer()
}, 1000);
var ctr = 0;
/* Function being called every second.
 * Calls HRMS method and asks for the list of people to be notified.
 */
function myTimer() {
    var d = new Date();
    if (d.getHours() == 16 && !notified) {
        notified = true;
        console.log("IT'S 10 AM!     " + ctr);
        /* var messageData = {
             recipient: {
                 id: globalSenderId
             },
             message: {
                 text: "It's 10 am!"
             }*/
    };
}

app.set('port', (process.env.PORT || 443))
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())

app.get('/', function(req, res) {
    res.send('Facebook Bot for HRMS')
}).listen(80);
app.get('/webhook', function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'webhooktoken') {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

//Function that connects the FB Chatbot to NodeJS
app.post('/webhook', function(req, res) {
    var data = req.body;
    if (data.object == 'page') {
        data.entry.forEach(function(pageEntry) {
            var pageID = pageEntry.id;
            var timeOfEvent = pageEntry.time;
            pageEntry.messaging.forEach(function(event) {
                if (event.message && event.message.text) {
                    receivedMessage(event);
                }
            });
        });
        res.sendStatus(200);
    }
});

app.get('/notifyusers', function(req, res) {

    // res.send('Notify Users');
    console.log("Notify GET");
    res.sendStatus(200);
});

app.post('/notifyusers', function(req, res) {

    res.send('Notify Users');
    console.log("app post notify");
    res.sendStatus(200);
});

/*
var req = {
    method: 'GET',
    url: 'http://192.168.30.210:8082/services/character/test,
    headers : {
        'Content-Type' : 'application/json'
    },
    data: JSON.stringify({ test: 'test' })
};
*/

// Assign handlers immediately after making the request,
// and remember the jqxhr object for this request

/*require("jsdom").env("", function(err, window) {
    if (err) {
        console.error(err);
        return;
    }
    var $ = require("jquery")(window);

    var jqxhr = $.getJSON("http://192.168.30.210:8082/services/character/test", function() {
            console.log("success");
        })
        .done(function() {
            console.log("second success");
        })
        .fail(function() {
            console.log("error");
        })
        .always(function() {
            console.log("complete");
        });

    // Perform other work here ...

    // Set another completion function for the request above
    jqxhr.complete(function() {
        console.log("second complete");
    });
});*/






xhr = new XMLHttpRequest();
var url = "https://192.168.30.210:8082/services/character/test";

xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function() {
    console.log(this.readyState);
    if (this.readyState === 4) {
        console.log("Ready State 4");
        console.log(this.responseText);
    }
    console.log("ReadyState checking done");
});

xhr.open("GET", url, true);
xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");


xhr.send();

function receivedMessage(event) {
    var senderID = event.sender.id;
    globalSenderId = senderID;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message.text;

    var request = app2.textRequest("hi", {
        sessionId: '<unique session id>'
    });

    request.on('response', function(response) {
        var token = response.result.parameters.token; //
        console.log("INTENT NAME: " + response.result.metadata.intentName);

        if (response.result.metadata.intentName === "file_leave" && response.result.parameters.hours !== "") {
            isRegistered(senderID, response);
        }
    });

    request.on('error', function(error) {});
    request.end();
    var messageText = "Echo: " + event.message.text;

    var messageData = {
        recipient: {
            id: senderID
        },
        message: {
            text: messageText
        }
    };
    callSendAPI(messageData);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: token
        },
        method: 'POST',
        json: messageData

    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;
            console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
            console.log("Successfully sent generic message: %s", messageData.message.text);
        } else {
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });
}

var options = {
    url: 'https://192.168.30.210:8082/services/character/test',
    port: 8082,
    method: 'GET',
    json: true
}
request(options, function(error, response, body) {
    if (error) console.log(error + "HEEH1");
    else console.log(body + "HEEH");
});

http.get("http://192.168.30.210:8082/services/character/test", function(res) {
    console.log("Got response: " + res.statusCode);
}).listen(8082);

/*
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
    console.log("The app is now up and running.");
})*/
