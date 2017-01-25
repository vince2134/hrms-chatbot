var apiai = require('apiai');

var app = apiai("b464d87b79f947bc9197a66b7ff346b2");

var request = app.textRequest('hi', {
    sessionId: '21'
});

request.on('response', function(response) {
    console.log(response);
    console.log("REQUEST");
});

request.on('error', function(error) {
    console.log(error);
    console.log("RESPONSE");
});

request.end();