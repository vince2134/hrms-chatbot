var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var mysql = require('./node_modules/mysql');
var app = express();
var apiai = require('apiai');
var app2 = apiai("b464d87b79f947bc9197a66b7ff346b2");
var globalSenderId;
var notified = false;
var register = false;
var intent = "";
var token = "EAAaA4LJeypQBABay9GkjkbF02ri0qx218cby6M3q6ZBGri2qzm9J1XZBIVgxFcRvBpoZCinySRcptTrACfJEki0e9XXMqDMr83Hc5ZBkAX3LNW1p4yPGpiAeyeoZCVCqVK2LyOOCZA53zpV8WXrQZB7mV0gC7PfNyrNRw6sCIikNAZDZD";
var https = require('https');
var fs = require('fs');

// First you need to create a connection to the db

var sslOptions = {
  key: fs.readFileSync('../ssl-cert/server.key'),
  cert: fs.readFileSync('../ssl-cert/server.crt'),
  ca: fs.readFileSync('../ssl-cert/ca.crt'),
  passphrase: 'ideyatech',
  requestCert: true,
  rejectUnauthorized: false
};

var secureServer = https.createServer(sslOptions, app).listen('443', function () {
  console.log("Secure server listening on port 443");
});


var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "ideyatech",
    database: "hrms_db"
});

con.connect(function(err) {
    console.log("connecting to DB");
    if (err) {
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection established');
   // console.log("WAAAAT" + notified);
    var myVar = setInterval(function() {
        myTimer()
    }, 1000);

    function myTimer() {
        var d = new Date();
        //console.log(notified);
        if (d.getHours() + 8 == 14 && !notified) {
            notified = true;
            console.log("IT'S 10 AM!");
            console.log(globalSenderId);
            var messageData = {
                recipient: {
                    id: globalSenderId
                },
                message: {
                    text: "It's 10 am!"
                }
            };

            callSendAPI(messageData);
        }
    }
});

app.set('port', (process.env.PORT || 443))
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())

app.get('/', function(req, res) {
    res.send('Facebook Bot')
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


/*
app.post('/notifyusers', function(req, res) {
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
*/



function handleDisconnect() {
    con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "ideyatech",
    database: "hrms_db"
    });
    // Recreate the connection, since
    // the old one cannot be reused.

    con.connect(function(err) { // The server is either down
        if (err) { // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        } // to avoid a hot loop, and to allow our node script to
    }); // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    con.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect(); // lost due to either server restart, or a
        } else { // connnection idle timeout (the wait_timeout
            throw err; // server variable configures this)
        }
    });
}

function callQuery(query) {
    con.query(query, function(err, rows) {
        if (err) /*//throw err;{}*/ {
            handleDisconnect();
            callQuery(query);
        }
        console.log('Data received from Db:\n');
        console.log(rows);

        //  con.end();
    });
}

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
        if (response.result.metadata.intentName === "register_account" && token !== "") {
           con.query("SELECT fb_id FROM bot_mapping WHERE fb_id = '" + senderID + "';", function(err, rows) {
               if (err) throw err;

               console.log('CHECK IF REGISTERED: Data received from Db:\n');
               console.log(rows.length);//

               if(rows.length > 0){
                  var messageData = {
                      recipient: {
                          id: senderID
                      },
                      message: {
                          text: "Registration failed. You have registered already. :)"//
                      }
                  };

                  callSendAPI(messageData);
               }
               else{
                  con.query("UPDATE bot_mapping SET fb_id = '" + senderID + "' WHERE token = '" + response.result.parameters.token + "';", function(err, rows) {
                      if (err) throw err;

                      console.log('Data received from Db:\n');
                      console.log(rows);

                      if (rows.affectedRows > 0) {
                          var messageData = {
                              recipient: {
                                  id: senderID
                              },
                              message: {
                                  text: "Registration successful! I can now please you for today."
                              }
                          };

                          callSendAPI(messageData);
                      } else {
                          var messageData = {
                              recipient: {
                                  id: senderID
                              },
                              message: {
                                  text: "Invalid token please try registering again."
                              }
                          };

                          callSendAPI(messageData);
                      }
                      //con.end();
                  });
               }
               
           });
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

function isRegistered(user_id, response) {
    var leave_type = response.result.parameters.leave_type;

    console.log("isRegistered");
    con.query("SELECT * FROM bot_mapping where fb_id = '" + user_id + "';", function(err, rows) {
        if (err) throw err;

        console.log('CHECK REGISTER Data received from Db:\n');
        console.log(rows);
        console.log("LENGTH: " + rows.length);

        if (rows.length > 0) {
            console.log("TRUEEEEEEEEEEE");
            register = true;
        }

        if (register) {
            register = false;
            var dates = response.result.parameters.date_period.split("/");
            var start_date = dates[0];
            var end_date = dates[1];
            console.log("START DATE: " + start_date);
            console.log("END DATE: " + end_date);
            console.log("LEAVE TYPE: " + leave_type);
            console.log("HOURS: " + response.result.parameters.hours);
            console.log("RECIPIENT: " + user_id);
            console.log(response);

            con.query("INSERT INTO test (name) VALUES('" + start_date + "');", function(err, rows) {
                if (err) {
                    var messageData = {
                        recipient: {
                            id: user_id
                        },
                        message: {
                            text: "An error has occured. Please try again later."
                        }
                    };

                    callSendAPI(messageData);
                    throw err;
                }

                console.log('Data received from Db:\n');
                console.log(rows);
                //con.end();
                if (leave_type === "vacation") {
                    var messageData = {
                        recipient: {
                            id: user_id
                        },
                        message: {
                            text: "Your " + leave_type + " leave from " + start_date + " to " + end_date + " has been filed. :) Enjoy your vacation!"
                        }
                    };
                } else if (leave_type === "sick") {
                    var messageData = {
                        recipient: {
                            id: user_id
                        },
                        message: {
                            text: "Your " + leave_type + " leave from " + start_date + " to " + end_date + " has been filed. :( Get well soon!"
                        },
                        quick_replies : {

                              content_type : "text",
                              title: "Test",
                              payload: "test"

                        }
                    };
                } else {
                    var messageData = {
                        recipient: {
                            id: user_id
                        },
                        message: {
                            text: "Your " + leave_type + " leave from " + start_date + " to " + end_date + " has been filed. :)"
                        }
                    };
                }

                callSendAPI(messageData);
            });
        } else {
            var messageData = {
                recipient: {
                    id: user_id
                },
                message: {
                    text: "You haven't registered yet. Please type 'register' to register to this amazing chatbot."
                }
            };

            callSendAPI(messageData);
        }
    });
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


