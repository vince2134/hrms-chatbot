var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var apiai = require('apiai');
//API.AI Client Access Token
var app2 = apiai("f725e735395240e5a209e7a034ba22c1");
var globalSenderId;
//notifier - indicator used to know whether employees have already been notified
var notified = false;
var register = false;
var intent = "";
//FB Page Access Token
var token = "EAAaVinNu9QEBADaP0aXQjTOBqMvOqk0VS7Vrm1hcpzlF4o4ueH3vj9g2QzKylCPZAn8fVkQw1CjItOtI5ErlesKCO2pRjs3ywHCbL9nT1WRMbXnzZAxFStcJ346WALwds5z9LraMlXdm2a8EPolL5V0MlZAhWdTZCOMuYZAH3lwZDZD";
var https = require('https');
var http = require('http');
var fs = require('fs');
var mysql = require('./node_modules/mysql');
var temptoken;

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "ideyatech",
    database: "hrms_chatbot"
});

con.connect(function(err) {
    if (err) {
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection to DB established');
});

// Function that ticks every 1 second.
console.log("Start Timer");
var myVar = setInterval(function() {
    myTimer()
}, 1000);

/* Function being called every second.
 * Calls the function that asks HRMS for the list of people to be notified if they forgot to log in Unfuddle.
 */
function myTimer() {
    var d = new Date();
    if (d.getHours() == 17 && !notified) {
        notified = true;
        console.log("IT'S  PM!     ");
        notifyUnloggedUsers();
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
        //console.log(response.result.parameters);


        isRegistered(senderID, response);
    });
    request.on('error', function(error) {});
    request.end();

    var messageText = "Echo: " + event.message.text;

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
            console.log("Successfully sent generic message %s to recipient %s", messageData.message.text, recipientId);
            //console.log(messageData);
        }
    });
}

function isRegistered(user_id, response) {
    var messageData = {
        recipient: {
            id: user_id
        },
        message: {
            text: "What is your verification code? (Please check your email)"
        }
    };

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
        console.log(register);

        if (response.result.metadata.intentName == "file_leave" &&
            response.result.parameters.reason !== "") {

            if (register == false) {
                messageData.message.text = "You haven't registered yet. Please type 'register <email>' before filing a leave."
                callSendAPI(messageData);
            } else {
                console.log(response.result.parameters);
                fileLeave(response, user_id);
            }
        } else if ((response.result.metadata.intentName == "file_overtime" || response.result.metadata.intentName == "file_undertime") && response.result.parameters.reason !== "") {
            if (register == false) {
                messageData.message.text = "You haven't registered yet. Please type 'register <email>' before filing a leave."
                callSendAPI(messageData);
            } else {
                console.log(response.result.parameters);
                fileLeave(response, user_id);
            }
        } else if (response.result.metadata.intentName == "file_offset" &&
            response.result.parameters.reason !== "") {

            if (register == false) {

                messageData.message.text = "You haven't registered yet. Please type 'register <email>' before filing an offset."
                callSendAPI(messageData);
            } else {
                console.log(response.result.parameters);
                fileOffset(response, user_id);
            }
        } else if (response.result.metadata.intentName == "register_account" &&
            response.result.parameters.email !== "" &&
            response.result.parameters.token !== "") {

            console.log("<<<<<<<<VALIDATE USER>>>>>>>>");
            validateUser(response.result.parameters.email, user_id, response.result.parameters.token);
        } else if (response.result.metadata.intentName == "register_account" &&
            response.result.parameters.email !== "") {
            if (register == false)
                registerUser(response.result.parameters.email, user_id);
            else {
                messageData.message.text = "Registraion Failed. You are already registered to an account."
                callSendAPI(messageData);
            }
        }
    });
}

/*
 * Function for the registration of users to their email.
 'http://23.97.59.113/hrms/chatbot-user/register'
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
            console.log(body);
            console.log("Register Success: " + info.success);

            if (info.success == true) {
                console.log("[registerUser] Success!");
                callSendAPI(tokenRequest);

            } else {
                console.log("[registerUser] Failed");
                tokenRequest.message.text = JSON.stringify(info.message);
                callSendAPI(tokenRequest);
            }
        } else {
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
            } else {
                validationConfirmation.message.text = "Registraion Failed. You entered the wrong verification code. " +
                    "You can restart the process of registration.";
                callSendAPI(validationConfirmation);
            }
        }
    });
}

function notifyUnloggedUsers(){
   options = {
      url: 'http://23.97.59.113/hrms/chatbot-user/getAllWithUnloggedHours',
      method: 'GET',
      qs: {
      }
   }
   /*var notification = {
      recipient: {
           id: fbId
      },
      message: {
           text: "Excuse me. You have not logged in unfuddle in the previous days. Please log as soon as possible or there will be consequences for your misconduct."
      }
   };*/
   request(options, function(error, response, body) {
      if (!error && response.statusCode == 200) {
         console.log("NOTIFY");
           var info = JSON.parse(body);
           console.log(body);
               //callSendAPI(notification);

      }
   });
}

function dateRangeToHours(dateRange) {
    var dates = dateRange.split('/');
    var date1 = dates[0].split('-');
    var date2 = dates[1].split('-');

    var oneDay = 24 * 60 * 60 * 1000;
    var firstDate = new Date(parseInt(date1[0]), parseInt(date1[1]), parseInt(date1[2]));
    var secondDate = new Date(parseInt(date2[0]), parseInt(date2[1]), parseInt(date2[2]));

    var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay))) * 8 + 8;

    return diffDays;
}


function fileLeave(response, fbId) {
    console.log("fileLeave");
    //192.168.30.210:8080/opentides/chatbot-leave/fileleave

    var date;
    var numberOfHours;

    if (response.result.metadata.intentName == "file_overtime" || response.result.metadata.intentName == "file_undertime") {
        date = [response.result.parameters.date_custom.date, response.result.parameters.date_custom.date];
        numberOfHours = response.result.parameters.hours.amount;
    } else {
        if (response.result.parameters.date_custom.date_period != null) {
            date = response.result.parameters.date_custom.date_period.split('/');
            console.log("DATES: " + date[0] + " to " + date[1]);
            numberOfHours = dateRangeToHours(response.result.parameters.date_custom.date_period);
        } else if (response.result.parameters.date_custom.date != null) {
            date = [response.result.parameters.date_custom.date, response.result.parameters.date_custom.date];
            numberOfHours = 8;
        }
    }
    var userToken;
    var leaveFormat;
    con.query("SELECT TOKEN FROM user_mapping where FB_ID = '" + fbId + "';", function(err, rows) {
        if (err) throw err;
        console.log('RETRIEVE TOKEN');

        console.log(rows[0].TOKEN + "\n");

        if (rows.length > 0) {
            console.log("tokenretrieved:" + rows[0].TOKEN);

            userToken = rows[0].TOKEN;
            leaveFormat = {
                'facebookId': fbId,
                'chatbotToken': userToken,
                'leaveData': {
                    'startDate': date[0],
                    'endDate': date[1],
                    'leaveType': response.result.parameters.leave_type,
                    'numberOfHours': numberOfHours,
                    'reason': response.result.parameters.reason
                }
            };
            sendLeaveDetails(fbId, userToken, date[0], date[1], response.result.parameters.leave_type, numberOfHours, response.result.parameters.reason, leaveFormat);
        }
    });
}

function sendLeaveDetails(fbId, userToken, date1, date2, leavetype, hours, reason, leaveFormat) {
    options = {
        url: 'http://23.97.59.113/hrms/chatbot-leave/fileleave',
        method: 'GET',
        qs: {
            "facebookId": fbId,
            "chatbotToken": userToken,
            "leaveData": "{ \"startDate\" :\"" + date1 + "\"," +
                "\"endDate\":\"" + date2 + "\"," +
                "\"leaveType\":\"" + leavetype + "\"," +
                "\"numberOfHours\":" + hours + "," +
                "\"reason\":\"" + reason +
                "\"}"
        }
    };

    console.log(JSON.stringify(options));

    var fileLeaveConfirmation = {
        recipient: {
            id: fbId
        },
        message: {
            text: "Your leave has been filed."

        }
    };
    request(options, function(error, response, body) {
        try {
            console.log(response.statusCode);
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                console.log("Filing Leave Success: " + JSON.stringify(body));
                /*console.log("Filing Leave Success: " + response);*/

                if (info.success == true) {
                    console.log("[fileLeave] Success!");
                    callSendAPI(fileLeaveConfirmation);

                } else {
                    console.log("[fileLeave] Failed");
                    fileLeaveConfirmation.message.text = "Filing of leave failed. Please see the details below:\n\n"
                    var errorCount = Object.keys(info.extras.fieldErrors).length;
                    console.log("Error count: " + errorCount);
                    console.log("LOG 1:" + info.extras.fieldErrors[0]);
                    console.log("LOG 2:" + info.extras.fieldErrors[1]);
                    if (errorCount > 0 && info.extras.fieldErrors[0] !== info.extras.fieldErrors[1]) {
                        for (var i = 0; i < errorCount; i++) {
                            fileLeaveConfirmation.message.text += "• " + info.extras.fieldErrors[i] + "\n";
                        }
                    }
                }
            } else {
                console.log("<<<<<<<<FILE LEAVE  FAILED>>>>>>>>   ");
                fileLeaveConfirmation.message.text = "Filing of leave Failed. HRMS Connection Error"
                callSendAPI(fileLeaveConfirmation);
                console.log("BODY : " + JSON.stringify(body));
            }
        } catch (error) {
            fileLeaveConfirmation.message.text = "Error: The server is down but you can continue the filing process. We will inform you when your leave has been filed when the server goes back up.";
            callSendAPI(fileLeaveConfirmation);
        }
    });
}

function retrieveToken(user_id) {
    con.query("SELECT TOKEN FROM user_mapping where FB_ID = '" + user_id + "';", function(err, rows) {
        if (err) throw err;
        console.log('RETRIEVE TOKEN');

        console.log(rows[0].TOKEN + "\n");

        if (rows.length > 0) {
            console.log("tokenretrieved:" + rows[0].TOKEN);

            return rows[0].TOKEN;
        } else {
            return null;
        }
    });
}

function fileOffset(response, fbId) {
    console.log("fileOffset");
    console.log(response.result.parameters);
    var date;
    var userToken;
    var leaveFormat;
    con.query("SELECT TOKEN FROM user_mapping where FB_ID = '" + fbId + "';", function(err, rows) {
        if (err) throw err;
        console.log('RETRIEVE TOKEN');

        console.log(rows[0].TOKEN + "\n");

        if (rows.length > 0) {
            console.log("tokenretrieved:" + rows[0].TOKEN);
            userToken = rows[0].TOKEN;
        };
        console.log("leave format = " + JSON.stringify(leaveFormat));
        sendOffsetDetails(fbId, userToken, response.result.parameters.from_date, response.result.parameters.to_date,
            response.result.parameters.offset, response.result.parameters.hours.amount, response.result.parameters.reason);

    });
}

function sendOffsetDetails(fbId, userToken, dateFrom, dateTo, leavetype, hours, reason) {

    console.log("hours" + hours);

    var options = {
        url: 'http://23.97.59.113/hrms/chatbot-leave/fileleave',
        method: 'GET',
        qs: {
            "facebookId": fbId,
            "chatbotToken": userToken,
            "leaveData": "{ \"offsetFrom\" :\"" + dateTo + "\"," +
                "\"offsetTo\":\"" + dateFrom + "\"," +
                "\"leaveType\":\"" + leavetype + "\"," +
                "\"numberOfHours\":" + hours + "," +
                "\"reason\":\"" + reason +
                "\"}"
        }
    };

    console.log("options" + options);
    var fileLeaveConfirmation = {
        recipient: {
            id: fbId
        },
        message: {
            text: "Your leave has been filed."

        }
    };
    request(options, function(error, response, body) {
        try {
            console.log(response.statusCode);
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                console.log("Filing Leave Success: " + JSON.stringify(body));
                /*console.log("Filing Leave Success: " + response);*/

                if (info.success == true) {
                    console.log("[fileOffset] Success!");
                    callSendAPI(fileLeaveConfirmation);

                } else {
                    console.log("[fileOffset] Failed");
                    fileLeaveConfirmation.message.text = "Filing of leave Failed. Please follow the rules for filing of leaves"
                    callSendAPI(fileLeaveConfirmation);
                }
            } else {
                console.log("<<<<<<<<FILE OFFSET  FAILED>>>>>>>>");
                fileLeaveConfirmation.message.text = "Filing of leave Failed. HRMS Connection Error"
                callSendAPI(fileLeaveConfirmation);
                console.log("BODY : " + JSON.stringify(body));
            }
        } catch (err) {
            fileLeaveConfirmation.message.text = "Error: The server is down but you can continue the filing process. We will inform you when your leave has been filed when the server goes back up.";
            callSendAPI(fileLeaveConfirmation);
        }
    });
}

function notifyTeam(userToken, fbId)
{
    options = {
      url: 'http://23.97.59.113/hrms/chatbot-user/getAllOnSameProject',
      method: 'GET',
      qs: {
          "chatbotToken": userToken,
          'facebookId': fbId
      }
   }
   /*var notification = {
      recipient: {
           id: fbId
      },
      message: {
           text: "Excuse me. You have not logged in unfuddle in the previous days. Please log as soon as possible or there will be consequences for your misconduct."
      }
   };*/
   request(options, function(error, response, body) {
      if (!error && response.statusCode == 200) {
         console.log("<<<<<<<<<<<<<<<<<<<<Notify Team>>>>>>>>>>>>>>>>>>>>>");
           var info = JSON.parse(body);
           console.log(body);
               //callSendAPI(notification);

      }
   });
}
