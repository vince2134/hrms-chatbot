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
//FUTURE: Remove.
var temptoken;
// Function that ticks every 1 second.
console.log("Start Timer");
var myVar = setInterval(function() {
    myTimer()
}, 1000);

//updateIntent();
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "ideyatech",
    database: "hrms_chatbot"
});

con.connect(function (err) {
    if (err) {
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection to DB established');
});

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

    var messageData = {
        recipient: {
            id: senderID
        },
        message: {
            text: messageText
        }
    };

    var request = app2.textRequest(message, {
        sessionId: '<unique session id>'
    });
    console.log("Received : " + message);

    request.on('response', function(response) {

        console.log("INTENT NAME: " + response.result.metadata.intentName);
        console.log(response.result.parameters);
        handleIntent(response, senderID);
    });

    request.on('error', function(error) {});
    request.end();

    var messageText = "Echo: " + event.message.text;


    callSendAPI(messageData);
}

function isRegistered(user_id, response) {
    console.log("isRegistered");
    register = false;

    con.query("SELECT * FROM user_mapping where FB_ID = '" + user_id + "';", function(err, rows) {
        if (err) throw err;
        console.log('CHECK REGISTER Data received from Db:');
        console.log(rows + "\n");

        if (rows.length > 0) {
            console.log("<<<<<<<<<<<<<User is Registered>>>>>>>>>>>>>>");
            register = true;
        }
    });

    return register;
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
            console.log("Successfully sent generic message %s to recipient %s", messageData.message.text, recipientId);
            //console.log(messageData);
        }
    });
}

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

    var options = {
        url: 'http://23.97.59.113/hrms/chatbot-user/register',
        method: 'GET',
        qs: {
            'emailAddress': email
        }
    }

    request(options, function(error, response, body) {

        if (!error && response.statusCode == 200) {
            // Print out the response body
            var info = JSON.parse(body);
            console.log("Register Success: " + info.success);
            if (info.success == true) {
                console.log("[registerUser] Success!");
                callSendAPI(tokenRequest);

            } else {
                console.log("[registerUser] Failed");
                tokenRequest.message.text = "Registraion Failed. You are already registered to an account."
                callSendAPI(tokenRequest);
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
    var validationConfirmation = {
        recipient: {
            id: fbId
        },
        message: {
            text: ""
        }
    };

    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
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
                        validationConfirmation.message.text = "Registraion successful. You can now use Aria."
                        callSendAPI(validationConfirmation);
                        temptoken = token;
                    });
                }
            }
            else
            {
                validationConfirmation.message.text = "Registraion Failed. You entered the wrong verification code. "+
                    "You can restart the process of registration.";
                callSendAPI(validationConfirmation);
            }
        }
    });
}

function fileLeave(fbId, token, response)
{
    console.log("fileLeave");
    console.log("response " + response);
    options = {
        url: 'http://23.97.59.113/hrms/chatbot-user/validate',
        method: 'GET',
        qs: formatLeave(response, fbId,token)
        }
    var fileLeaveConfirmation = {
        recipient: {
            id: fbId
        },
        message: {
            text: "Your leave has been filed."
        }
    };

   /* request(options, function(error, response, body) {

        if (!error && response.statusCode == 200) {
            //var info = JSON.parse(body);
            console.log("Filing Leave Success: " + info.success);
            if (info.success == true) {
                console.log("[fileLeave] Success!");
                callSendAPI(fileLeaveConfirmation);

            } else {
                console.log("[fileLeave] Failed");
                tokenRequest.message.text = "Filing of leave Failed."
                callSendAPI(fileLeaveConfirmation);
            }
        }
        else{
            console.log("<<<<<<<<FILE LEAVE  FAILED>>>>>>>>   ");
            console.log(error);
        }
    });*/
}

//console.log("HOURS RANGE: " + dateRangeToHours('2017-02-22/2017-02-25'));

function dateRangeToHours(dateRange){
   var dates = dateRange.split('/');
   var date1 = dates[0].split('-');
   var date2 = dates[1].split('-');

   var oneDay = 24*60*60*1000;
   var firstDate = new Date(parseInt(date1[0]), parseInt(date1[1]), parseInt(date1[2]));
   var secondDate = new Date(parseInt(date2[0]), parseInt(date2[1]), parseInt(date2[2]));

   var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay))) * 8 + 8;

   return diffDays;
}

console.log(retrieveToken('1353975678010827'));

function retrieveToken(user_id){
   con.query("SELECT TOKEN FROM user_mapping where FB_ID = '" + user_id + "';", function(err, rows) {
       if (err) throw err;
       console.log('RETRIEVE TOKEN');

       console.log(rows[0].TOKEN + "\n");

       if (rows.length > 0) {
           console.log("tokenretrieved:" + rows[0].TOKEN);

           return rows[0].TOKEN;
       }
       else {
          return null;
       }
   });
}

function handleIntent(response, senderID)
{

    if (response.result.metadata.intentName === "file_leave" &&
            response.result.parameters.reason !== "") {

            isRegistered(senderID, response);
            console.log(response.result.parameters);
            console.log("resopnse : " + response);
            fileLeave(response,senderID, retrieveToken(senderID));

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
            if(isRegistered(senderID) == false)
                registerUser(response.result.parameters.email, senderID);
            else
            {
                mesageData.message.text = "Registraion Failed. You are already registered to an account."
                callSendAPI(messageData);
            }
        }
}



function formatLeave(response, fbId, token)
{
    var date;
    var numberOfHours;
    if(response.result.parameters.date_custom.date_period != null)
    {
        date = response.result.parameters.date_custom.date_period.split('/');
        console.log("DATES: " + date[0] + " to " + date[1]);
        numberOfHours = dateRangeToHours(response.result.parameters.date_custom.date_period);
    }
    else if(response.result.parameters.date_custom.date != null)
    {
        date = [result.parameters.date_custom.date, result.parameters.date_custom.date];
        numberOfHours = 8;
    }

    var leaveFormat = {
        'facebookId': fbId,
        'chatbotToken': token,
        'leave': {
            'startDate' : date[0],
            'endDate' : date[1],
            'leaveType' : response.result.parameters.leave_type,
            'numberOfHours' : numberOfHours,
            'reason' : response.result.parameters.reason
    }
    };

        console.log(leaveFormat);
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
