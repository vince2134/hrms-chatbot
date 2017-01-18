

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
