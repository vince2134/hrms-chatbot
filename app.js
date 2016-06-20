var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

var token = "EAAZAEEXXtK1YBANWR62ZCbVi31fkcQaeSEqGjW8VNdGwhjRB8UDxleUmDH91MBsFZAqRVcZC2B06DKHqoDlr0rXQ8Tb9qu39aueZCFsjJTebWD5rhfNlnGAslh6YNJqiWv95CZCoVGyh5aOHudlNbJZB8jshr8ZCVZCNqVeQKoAZATogZDZD";


var app = express();
app.set('port', (process.env.PORT || 1000))
app.use(bodyParser.urlencoded({extended: false}))


app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})


app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === token) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});