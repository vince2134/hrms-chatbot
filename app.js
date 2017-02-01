var express = require('express');  
var bodyParser = require('body-parser');  
var request = require('request');  
var app = express();
var apiai = require('apiai');
var appAPI = apiai("b464d87b79f947bc9197a66b7ff346b2");




app.use(bodyParser.urlencoded({extended: false}));  
app.use(bodyParser.json());  
app.listen((process.env.PORT || 3000)); 

// Server frontpage
app.get('/', function (req, res) {  
    res.send('This is TestBot Server');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {  
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        console.log("Webhook Success");
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

var mysql = require("mysql");

// First you need to create a connection to the db
var con = mysql.createConnection({
  host: "us-cdbr-iron-east-04.cleardb.net",
  user: "bb48df31d48014",
  password: "5afe8232",
  database: "heroku_a3ffbcfa5975cfe"

});

con.connect(function(err){
  if(err){
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established');
});

// handler receiving messages
app.post('/webhook', function (req, res) {  
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
            
            var request = appAPI.textRequest("hi", {
                sessionId: "IDTChatBot"
            });
            
            sendMessage(event.sender.id, {text: "Echo: " + event.message.text});
            console.log("Received a Message");
            console.log("Message Received : " + event.message.text);
            console.log(event.sender.id);
            
            
           
        request.on('response', function(response) {
            console.log(response);
            console.log("REQUEST");
        });

        request.on('error', function(error) {
            console.log(error);
            console.log("RESPONSE");
        });

        requestAPI.end();

        }
    }
    res.sendStatus(200);
});



// generic function sending messages
function sendMessage(recipientId, message) {  
    console.log("Sending a Message");
    console.log("Message ");
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
    console.log("Message Sent: " + message.text);
};



