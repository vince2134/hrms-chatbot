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
    console.log("Notify GET");
    res.sendStatus(200);
});

app.post('/notifyusers', function(req, res) {

    res.send('Notify Users');
    console.log("app post notify");
    res.sendStatus(200);
});

console.log("Trying Notify User");
trigger.init();
trigger.post();
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

xhr = new XMLHttpRequest();
var url = "http://192.168.30.210:8082/services/character/test";
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === 4) {
    console.log("Ready State 4");
    console.log(this.responseText);
  }
});

xhr.open("GET", url, true);
xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
/*xhr.onreadystatechange = function () {
>>>>>>> 7782cf84be725fef5d4c59137cd4a3a09f75a06f
    console.log("receiving something3");
   //if (xhr.readyState == XMLHttpRequest.DONE) {
    {
        console.log("receiving something1");
        console.log(xhr.responseText);
    }*/



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
      var token = response.result.parameters.token;//
        console.log("INTENT NAME: " + response.result.metadata.intentName);

        if (response.result.metadata.intentName === "file_leave" && response.result.parameters.hours !== "") {
            isRegistered(senderID, response);
        }
    });

    request.on('error', function(error) {
    });
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
    hostname: '192.168.30.210',
    port: '8082',
    path: '/services/character/test',
    method: 'GET',
    json:true
}
request(options, function(error, response, body){
    if(error) console.log(error + "HEEH1");
    else console.log(body + "HEEH");
});
/*
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
    console.log("The app is now up and running.");
})*/

////////////////////////////////////////////////////////////////////////////////////////
/*

var request = app2.textRequest('Ill be on sick leave today', {
    sessionId: 'HRMS Chatbot'
});


request.on('response', function(response) {
    console.log(response);
    console.log(response.result.parameters.date_custom);
    console.log("REQUEST");
    setIntent(response);
    if(intent != "register_account")
    {
        isUserRegistered(response);
    }
    else
    {
        registerUser(response);
    }
});

request.on('error', function(error) {
    console.log(error);
    console.log("RESPONSE");
});

request.end();


function registerUser(response)
{
    console.log("registerUser");
}


function isUserRegistered(response)
{
      con.query("SELECT * FROM users where USERNAME = '" + "atan" + "';", function(err, rows) {
        if (err) throw err;

        console.log('CHECK REGISTER Data received from Db:\n');
        console.log(rows);
        console.log("LENGTH: " + rows.length);

        if (rows.length > 0) {
            console.log("Rows returned: " + rows.length);
            register = true;
        }

        if(register)
        {
            console.log("User is registered.")
            if(intent == "file_leave")
            {
                fileLeave(response);
            }
            else if (intent == "file_offset")
            {
                fileOffset(response);
            }
            else if (intent == "file_overtime")
            {
                fileOvertime(response);
            }
            else if (intent == "file_undertime")
            {
                fileUndertime(response);
            }
            else if (intent == "approve_leave")
            {
                approveLeave(response);
            }
        }
        else
        {
            console.log("You are not registered. Please register first.");
        }
    });
}

function fileLeave(response)
{
    console.log("== fileLeave ==")
}

function fileOvertime(response)
{
    console.log("== fileOvertime ==")
}

function fileUndertime(response)
{
    console.log("== fileUndertime ==")
}

function fileOffset(response)
{
    console.log("== fileOffset ==")
}

function approveLeave(response)
{
    console.log("== approveLeave ==")
}


function checkExistingLeaves()
{
    SELECT * FROM anonymous.leaves
    WHERE START_DATE BETWEEN '2016-06-03' AND '2016-06-03'
	AND END_DATE BETWEEN '2016-06-03'AND '2016-06-03'
    AND EMPLOYEE_ID = 18
}

function setIntent(response)
{

    console.log("== Set Intent ==");
    if (response.result.metadata.intentName === "register_account" && response.result.parameters.token !== "")
    {
            intent = response.result.metadata.intentName;
            console.log("Intent : REGISTER");
    }
    else if (response.result.metadata.intentName === "file_leave" && response.result.parameters.date_custom !== "")
    {
            intent = response.result.metadata.intentName;
            console.log("Intent : FILE LEAVE");
    }
    else if (response.result.metadata.intentName === "file_offset" && response.result.parameters.duration !== "")
    {
            intent = response.result.metadata.intentName;
            console.log("Intent : FILE OFFSET");
    }
    else if (response.result.metadata.intentName === "file_overtime" && response.result.parameters.duration !== "")
    {
            intent = response.result.metadata.intentName;
            console.log("Intent : FILE OVETIME");
    }
    else if (response.result.metadata.intentName === "file_undertime" && response.result.parameters.duration !== "")
    {
            intent = response.result.metadata.intentName;
            console.log("Intent : FILE UNDERTIME");
    }
    else if (response.result.metadata.intentName === "approve_leave" && response.result.parameters.approve_leave !== "")
    {
            intent = response.result.metadata.intentName;
            console.log("Intent : APPROVE/DECLINE LEAVE");
    }

}
*/
