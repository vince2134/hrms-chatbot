var apiai = require('apiai');

var app = apiai("b464d87b79f947bc9197a66b7ff346b2");

var request = app.textRequest('ill be on sick leave today', {
    sessionId: 'request'
});

request.on('response', function(response) {
   // console.log(response);
    response.result.parameters.trial = "Added Object"
    console.log(response);
    console.log("REQUEST");
});

request.on('error', function(error) {
    console.log(error);
    console.log("RESPONSE");
});

request.end();