var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var mysql = require('./node_modules/mysql');
var app = express();
var apiai = require('apiai');
var app2 = apiai("6a44d3f36da94292a0ff936d57e298b8");
var globalSenderId;
var notified = false;
//var firebase = require("firebase");
//var database = firebase.database();
var token = "EAAFJiEO72j4BAD6HkTpQSbzzYLYmGRMey68u40DKmOrj5pDfsX54AJtpBM7oDn6ZAAO6J4eM70lYkzrzWDtyYX66E64gALUYRtq72RJgGFpwTIcbr9bORR0OCKdRtzJyQOgpz6vvdjveqk4xiXP3DS1ZADFIoRNT78SfXojAZDZD";
// Initialize Firebase
  /*var config = {
    apiKey: "AIzaSyANjPZEtg8JXi017TYN5InsDEcNBvXFIco",
    authDomain: "hrms-database.firebaseapp.com",
    databaseURL: "https://hrms-database.firebaseio.com",
    storageBucket: "hrms-database.appspot.com",
    messagingSenderId: "400928154855"
  };
  firebase.initializeApp(config);*/
  // First you need to create a connection to the db


    var con = mysql.createConnection({
      host: "us-cdbr-iron-east-04.cleardb.net",
      user: "b523f4395a2aab",
      password: "99761a45",
      database: "heroku_ab34a5deaa3b4fb"
    });

    con.connect(function(err){
        console.log("connecting to DB");
      if(err){
        console.log('Error connecting to Db');
        return;
      }
      console.log('Connection established');
      var myVar = setInterval(function(){ myTimer() }, 1000);

      function myTimer() {
          var d = new Date();
          if(d.getHours() + 8 == 14 && !notified){
            notified = true;
            console.log("IT'S 10 AM!");
            var messageData = {
              recipient: { id: "1832214557054836" },
              message: { text: "It's 10 am!" }
            };

            callSendAPI(messageData);
          }
      }
    });

app.set('port', (process.env.PORT || 1000))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', function (req, res) {
  res.send('Facebook Bot')
});
/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 *
 */
app.get('/webhook', function (req, res) {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'webhooktoken') {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same webhook.
 *
 */
app.post('/webhook', function (req, res) {
  var data = req.body;
  if (data.object == 'page') {
    data.entry.forEach(function (pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;
      pageEntry.messaging.forEach(function (event) {
        if (event.message && event.message.text) {
          receivedMessage(event);
        }
      });
    });
    res.sendStatus(200);
  }
});

function handleDisconnect() {
  con = mysql.createConnection({
    host: "us-cdbr-iron-east-04.cleardb.net",
    user: "b523f4395a2aab",
    password: "99761a45",
    database: "heroku_ab34a5deaa3b4fb"
  }); // Recreate the connection, since
                                                  // the old one cannot be reused.

  con.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  con.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

function callQuery(query){
  con.query(query,function(err,rows){
    if(err) /*//throw err;{}*/{
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

  var request = app2.textRequest(message, {
      sessionId: '<unique session id>'
  });

  request.on('response', function(response) {
    console.log("INTENT NAME: " + response.result.metadata.intentName);

    if(response.result.metadata.intentName === "file_leave" && response.result.parameters.hours !== ""){
      var dates = response.result.parameters.date_period.split("/");
      var start_date = dates[0];
      var end_date = dates[1];
      console.log("START DATE: " + start_date);
      console.log("END DATE: " + end_date);
      console.log("LEAVE TYPE: " + response.result.parameters.leave_type);
      console.log("HOURS: " + response.result.parameters.hours);
      console.log("RECIPIENT: " + recipientID);
      console.log(response);

      con.query("INSERT INTO test (name) VALUES('" + start_date + "');",function(err,rows){
        if(err) throw err;

        console.log('Data received from Db:\n');
        console.log(rows);

          //con.end();
      });
    }
  });

  request.on('error', function(error) {
      console.log(error);
  });

  request.end();

  var messageText = "Echo: " + event.message.text;
  //Insert api logic here


  /*con.query("INSERT INTO test (name) VALUES('" + message + "');",function(err,rows){
    if(err) throw err;

    console.log('Data received from Db:\n');
    console.log(rows);

      con.end();
  });*/
  //callQuery("SELECT * FROM test;");
  /*con.query("SELECT * FROM test;",function(err,rows){
    if(err) //throw err;
      handleDisconnect();
    console.log('Data received from Db:\n');
    console.log(rows);

    //  con.end();
  });*/

/*database.ref('/').once('value').then(function(snapshot) {
  var username = snapshot.val().username;
  // ...
});*/

  var messageData = {
    recipient: { id: senderID },
    message: { text: messageText }
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
    qs: { access_token: token },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
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

app.listen(app.get('port'), function () {
  console.log('running on port', app.get('port'))
})
