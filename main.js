var apiai = require('apiai');

var app2 = apiai("6a44d3f36da94292a0ff936d57e298b8");

var request = app2.textRequest('leave', {
    sessionId: '<unique session id>'
});

request.on('response', function(response) {
  console.log(response.result.metadata.intentName);
    console.log(response);
});

request.on('error', function(error) {
    console.log(error);
});

request.end();
