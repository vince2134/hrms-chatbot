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
var token = "EAAPjuqfpWPABAO3jNa0f6mqkSM9cxJEYqnz6Hqw1a2G1T8aQK7KjisFKg1vzG7xPmNycrO6i9HmPo9USJOaWBkYWhTuNh3djMVOWG5ZCXPqFjsWy9qRJIHZA4atnCuktd5ox4BB1uqV9ZA7YZB217PS3ht3yQD34xStVuimrzEbwZBFlIL7Aw";
var https = require('https');
var http = require('http');
var fs = require('fs');
var mysql = require('./node_modules/mysql');

// Function that ticks every 1 second.
console.log("Start Timer");
var myVar = setInterval(function() {
    myTimer()
}, 1000);

//updateIntent();
/*var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "ideyatech",
    database: "hrms_chatbot"
});

con.connect(function (err) {
    console.log("connecting to DB");
    if (err) {
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection established');
});*/

/* Function being called every second.
 * Calls HRMS method and asks for the list of people to be notified if they forgot to log in Unfuddle.
 */
// FUTURE: As a chatbot, I should be able to alert users if they fail to log their previous work hours on Unfuddle every 10am
function myTimer() {
    var d = new Date();
    if (d.getHours() == 16 && !notified) {
        notified = true;
        console.log("IT'S 4 PM!     ");
    };
}

app.set('port', (process.env.PORT || 8080))
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())

app.get('/', function(req, res) {
    res.send('Facebook Bot for HRMS')
}).listen(8080);

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

/*var request2 = http.get("http://23.97.59.113/hrms/chatbot-leave/get", function (res) {
    res.on('data', function (chunk) {
        console.log(chunk.toString('utf8'));
        registerUser("rrr@m.com", "test", "c6dfcb1c-cec0-4c67-8d20-0d3937249113");
    });
});*/

function receivedMessage(event) {

    var senderID = event.sender.id;
    globalSenderId = senderID;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message.text;

    var request = app2.textRequest(message, {
        sessionId: '<unique session id>'
    });

    console.log("Received : " + message);

    request.on('response', function(response) {
        var token = response.result.parameters.token;
        console.log("INTENT NAME: " + response.result.metadata.intentName);
        console.log(response.result.parameters);
        if (response.result.metadata.intentName === "file_leave" &&
            response.result.parameters.hours !== "") {

            isRegistered(response, senderID);
        }
        else if (response.result.metadata.intentName === "register_account" &&
                 response.result.parameters.email !== "" &&
                 response.result.parameters.token !== "") {

            console.log("<<<<<<<<VALIDATE USER>>>>>>>>");
            validateUser(response.result.parameters.email, senderID, response.result.parameters.token);
        }
        else if (response.result.metadata.intentName === "register_account" &&
                 response.result.parameters.email !== "" ) {

            console.log("<<<<<<<<REGISTER USER>>>>>>>>");
            registerUser(response.result.parameters.email, senderID);
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
        console.log(messageData);
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;
            console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
            console.log("Successfully sent generic message: %s", messageData.message.text);
            //console.log(messageData);
        }
    });
}

//http://23.97.59.113/hrms/chatbot-user/validate?emailAddress=aasd&facebookId=q34234&chatbotToken=12345
/*
 * Function for the registration of users to their email.
 */
function registerUser(email, senderID) {

      var tokenRequest = {
        recipient: {
            id: senderID
        },
        message: {
            text: "What is your verification code? (Please check your email)"
        }
    };


    // Configure the request
    var options = {
        url: 'http://23.97.59.113/hrms/chatbot-user/register',
        method: 'GET',
        qs: {
            'emailAddress': email
        }
    }



    // Start the request
    request(options, function(error, response, body) {

        console.log(response.statusCode);
        console.log(response.resoponseText);
        console.log(JSON.parse(body);
        if (!error && response.statusCode == 200) {
            // Print out the response body
            var info = JSON.parse(body);
            console.log("Register Success: " + info.success);
            if (info.success == true) {
                console.log("[registerUser] Success!");
                callSendAPI(tokenRequest);

            } else {
                console.log("[registerUser] Failed");
            }
        }
        else{
            console.log("<<<<<<<<REGISTER  USER  FAILED>>>>>>>>   ");
            console.log(error);
        }
    });
}

/*
* Function for validating the token entered by the user.
// FUTURE: As a chatbot, I should be able to register
*/
function validateUser(email, fbId, token) {
    // Configure the request
    options = {
        url: 'http://23.97.59.113/hrms/chatbot-user/validate',
        method: 'GET',
        qs: {
            'emailAddress': email,
            'facebookId': fbId,
            'chatbotToken': token
        }
    }
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            var info = JSON.parse(body);
            console.log("Validation Success: " + info.success);
            console.log(typeof(info.success));
            if (info.success == true) {
                console.log("[validateUser] Success!");
                if (token != null) {
                    con.query("INSERT INTO user_mapping(FB_ID, TOKEN, EMAIL) VALUES('" + fbId + "', '" + token + "', '" + email + "');", function(err, rows) {
                        if (err) throw err;
                        console.log('INSERT: Data received from Db:\n');
                        console.log(rows);
                    });
                }
            }
        }
    });
}

function updateIntent() {
    // Configure the request
    console.log("[METHOD] updateIntent");
    var link = 'https://api.api.ai/v1/intents?v=20150910';

    /* options = {
        uri: link,
        method: 'POST',
      headers: {
                "Authorization": "Bearer 05411b958f3840019c2e968e3ac72a63",
                "Content-Type": "application/json; charset=utf-8"
            },
            qs:
            */

    var dataJSON = {
        "name": "change appliance state",
        "auto": true,
        "contexts": [],
        "templates": [
            "turn @state:state the @appliance:appliance ",
            "switch the @appliance:appliance @state:state "
        ],
        "userSays": [{
                "data": [{
                        "text": "turn "
                    },
                    {
                        "text": "on",
                        "alias": "state",
                        "meta": "@state"
                    },
                    {
                        "text": " the "
                    },
                    {
                        "text": "kitchen lights",
                        "alias": "appliance",
                        "meta": "@appliance"
                    }
                ],
                "isTemplate": false,
                "count": 0
            },
            {
                "data": [{
                        "text": "switch the "
                    },
                    {
                        "text": "heating",
                        "alias": "appliance",
                        "meta": "@appliance"
                    },
                    {
                        "text": " "
                    },
                    {
                        "text": "off",
                        "alias": "state",
                        "meta": "@state"
                    }
                ],
                "isTemplate": false,
                "count": 0
            }
        ],
        "responses": [{
            "resetContexts": false,
            "action": "set-appliance",
            "affectedContexts": [{
                "name": "house",
                "lifespan": 10
            }],
            "parameters": [{
                    "dataType": "@appliance",
                    "name": "appliance",
                    "value": "\$appliance"
                },
                {
                    "dataType": "@state",
                    "name": "state",
                    "value": "\$state"
                }
            ],
            "speech": "Turning the \$appliance \$state\!"
        }],
        "priority": 500000
    }
    // Set the headers
    var headers = {
        "Authorization": "Bearer 05411b958f3840019c2e968e3ac72a63",
        "Content-Type": "application/json; charset=utf-8"
    }

    // Configure the request
    options = {
        url: 'https://api.api.ai/v1/intents?v=20150910',
        method: 'POST',
        headers: headers,
        form: dataJSON
    };

    /*    }
        request(options, function(error, response, body) {
                console.log("ResponseCode : " + response.statusCode);
                console.log("Body : " + body);
                console.log("Error: " + error);
            if(response.statusCode == 200)
                    console.log("[updateIntent] Success!");
        });*/
    var util = require('util');
    var exec = require('child_process').exec;

    /*var command = "curl -k -H \"Content-Type: application/json; charset=utf-8\" -H \"Authorization: Bearer 05411b958f3840019c2e968e3ac72a63\" --data \"{'name':'change appliance state 1','auto':true,'contexts':[],'templates':['turn @state:state the @appliance:appliance ','switch the @appliance:appliance @state:state '],'userSays':[{'data':[{'text':'turn '},{'text':'on','alias':'state','meta':'@state'},{'text':' the '},{'text':'bug report','alias':'report','meta':'@report'}],'isTemplate':false,'count':0},{'data':[{'text':'switch the '},{'text':'heating','alias':'appliance','meta':'@appliance'},{'text':' '},{'text':'off','alias':'state','meta':'@state'}],'isTemplate':false,'count':0}],'responses':[{'resetContexts':false,'action':'set-appliance','affectedContexts':[{'name':'house','lifespan':10}],'parameters':[{'dataType':'@appliance','name':'appliance','value':'\$appliance'},{'dataType':'@state','name':'state','value':'\$state'}],'speech':'Turning the \$appliance \$state\!'}],'priority':500000}\" \"https://api.api.ai/v1/intents?v=20150910\""

    child = exec(command, function(error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);

        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });*/

    var celebrants = "TEST";

    var command2 = "curl -k -X PUT -H \"Content-Type: application/json; charset=utf-8\" -H \"Authorization: Bearer 05411b958f3840019c2e968e3ac72a63\" --data \"{'name':'birthday_greeting','auto':true,'contexts':[],'templates':['Who are the @birthday:birthday for this month?','Who are the @birthday:birthday celebrants of this month?'],'userSays':[{'data':[{'text':'Who are the '},{'text':'celebrants','alias':'birthday','meta':'@birthday'},{'text':' '},{'text':'for this month','meta':'@sys.ignore','userDefined': false},{'text':'?'}],'isTemplate':false,'count':0},{'data':[{'text':'Who are the '},{'text':'birthday','alias':'birthday','meta':'@birthday'},{'text':' '},{'text':'celebrants','meta':'@sys.ignore','userDefined': false},{'text':' of '},{'text':' this month','meta': '@sys.ignore','userDefined':false},{'text':'?'}],'isTemplate':false,'count':0}],'responses':[{'resetContexts':false,affectedContexts':[],'parameters':[{'dataType':'@birthday','name':'birthday','value':'\$birthday','isList':'false'}],'speech':'" + celebrants + "'}],'priority':500000}\" \"https://api.api.ai/v1/intents/ac32491a-5140-42b5-a583-a7cb305e9f9a?v=20150910\""

    child2 = exec(command2, function(error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);

        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });
}
