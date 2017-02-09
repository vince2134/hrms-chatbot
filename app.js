var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
/*var trigger = require('./basetrigger');*/
var app = express();
//Connection for chatbot conversation using API.AI ***INSERT APIAI DASHBOARD URL HERE***
var apiai = require('apiai');
//API.AI Client Access Token
var app2 = apiai("f725e735395240e5a209e7a034ba22c1");
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
var mysql = require('./node_modules/mysql');

// Function that ticks every 1 second.
console.log("Start Timer");
var myVar = setInterval(function() {
    myTimer()
}, 1000);
var ctr = 0;

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "ideyatech",
    database: "hrms_chatbot"
});

con.connect(function(err) {
    console.log("connecting to DB");
    if (err) {
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection established');
});

/*con.query("INSERT INTO user_mapping(FB_ID, TOKEN, EMAIL) VALUES('test', 'test2', 'test3');", function(err, rows) {
   if (err) throw err;

   console.log('INSERT: Data received from Db:\n');
   console.log(rows);
   //con.end();
});*/

/* Function being called every second.
 * Calls HRMS method and asks for the list of people to be notified.
 */
function myTimer() {
    var d = new Date();
    if (d.getHours() == 16 && !notified) {
        notified = true;
        console.log("IT'S 4 PM!     ");
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

var request2 = http.get("http://23.97.59.113/hrms/chatbot-leave/get", function(res) {
    res.on('data', function(chunk) {
        console.log(chunk.toString('utf8'));
        registerUser("test@m.com", "asda", "fd2678e7-b046-4118-8360-18b2ac69e18a");
    });
});


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
        var token = response.result.parameters.token;
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

//http://23.97.59.113/hrms/chatbot-user/validate?emailAddress=aasd&facebookId=q34234&chatbotToken=12345
function registerUser(email, fbId, token) {
    /*request({
        uri: 'http://23.97.59.113/hrms/chatbot-user/register',
        method: 'POST',
        json: {emailAddress:'test1@idt.com'}

    }, function (error, response, body) {
        if (!error) {
            console.log("no error");
        } else {
           console.log(error);
            console.error("error2");
        }
    });*/
    // Configure the request

    var options = {
        url: 'http://23.97.59.113/hrms/chatbot-user/register',
        method: 'GET',
        qs: {
            'emailAddress': email
        }
    }

    if(token != null){
       options = {
           url: 'http://23.97.59.113/hrms/chatbot-user/validate',
           method: 'GET',
           qs: {
               'emailAddress': email,
               'facebookId': fbId,
               'chatbotToken': token
           }
       }
    }

    // Start the request
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            console.log(typeof(body));
            var info = JSON.parse(body);
            console.log(info.success);
            console.log(typeof(info.success));
            if (body.success == true) {
               console.log("success!");
                con.query("INSERT INTO user_mapping(FB_ID, TOKEN, EMAIL) VALUES('" + email + "', '" + fbId + "', '" + chatbotToken + "');", function(err, rows) {
                    if (err) throw err;

                    console.log('INSERT: Data received from Db:\n');
                    console.log(rows);
                    //con.end();
                });
            }
        }
    });
}
/*
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
    console.log("The app is now up and running.");
})*/
