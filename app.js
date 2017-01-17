var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var token = "EAAFJiEO72j4BAD6HkTpQSbzzYLYmGRMey68u40DKmOrj5pDfsX54AJtpBM7oDn6ZAAO6J4eM70lYkzrzWDtyYX66E64gALUYRtq72RJgGFpwTIcbr9bORR0OCKdRtzJyQOgpz6vvdjveqk4xiXP3DS1ZADFIoRNT78SfXojAZDZD";

app.set('port', (process.env.PORT || 1000))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', function (req, res) {
  res.send('Facebook Bot')
});

var mysql = require("mysql");

// First you need to create a connection to the db
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "mysqldev",
  database: "anonymous"
});

con.connect(function(err){
    console.log("connecting to DB");
  if(err){
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established');
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

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message.text;

  var messageText = "Echo: " + event.message.text;
  //Insert api logic here
  /*con.query('SELECT * FROM announcement',function(err,rows){
    if(err) throw err;

    console.log('Data received from Db:\n');
    console.log(rows);

      con.end()
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
