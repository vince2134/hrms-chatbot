var request = require('request');
var http = require('http');

function registerUser(email, senderID) {
console.log("reg");
      var tokenRequest = {
        recipient: {
            id: senderID
        },
        message: {
            text: "What is your verification code? (Please check your email)"
        }
    };

    var options = {
        url: 'http://192.168.30.210:8080/opentides/chatbot-user/register',
        method: 'GET',
        qs: {
            'emailAddress': email
        }
    }

    request(options, function(error, response, body) {
console.log("request");
        if (!error && response.statusCode == 200) {
            // Print out the response body
            var info = JSON.parse(body);
            console.log(body);
            console.log("Register Success: " + info.success);1
            if (info.success == true) {
                console.log("[registerUser] Success!");
                //callSendAPI(tokenRequest);

            } else {
                console.log("[registerUser] Failed");
                tokenRequest.message.text = "Registraion Failed. You are already registered to an account."
                //callSendAPI(tokenRequest);
            }
        }
        else{
            console.log("<<<<<<<<REGISTER  USER  FAILED>>>>>>>>   ");
            console.log(error);
        }
    });
}

registerUser('vina@ideyatech.com', '1353975678010828');
