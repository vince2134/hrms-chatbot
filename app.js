var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var token = "EAAFAb0qoKxgBAJWMyGYINDYRDM7cGRrqVDBFNopMl2SaM34FEzweSzJZBGdGtj6wbEZBLtkpV1QlkpfZCBRlGZAmz0bwWcZBRa1WejtxQ5ZCq2HhTGRWZB700paRKXnBIBQr5VQah6hTEIEH2hy4hDvdnQe26TZCnOoZBSSuupGqN1wZDZD";

app.set('port', (process.env.PORT || 2000))
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
    console.error("Failed validation. Make sure the validation tokens match.");//////
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

  var messageText = "I'm Siva, How can I help you ?";

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
