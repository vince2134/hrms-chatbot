var apiai = require('apiai');

var app = apiai("b464d87b79f947bc9197a66b7ff346b2");

var request = app.textRequest('register kervi@ideyatech.com', {
    sessionId: 'request'
});


function token ()
{
    request = app.textRequest('sBs8jgUH', {
    sessionId: 'request'
    });
}
                              
request.on('response', function(response) {
   // console.log(response);
    //response.result.parameters.token = "null"
    console.log(response);
    console.log("REQUEST");
});

request.on('error', function(error) {
    console.log(error);
    console.log("RESPONSE");
});

request.end();