var request = require('request');

var http = require('http');

function validateUser(email, fbId, token) {
    // Configure the request
    options = {
        url: 'http://192.168.30.210:8080/opentides/chatbot-user/validate',
        method: 'GET',
        qs: {
            'emailAddress': email,
            'facebookId': fbId,
            'chatbotToken': token
            }
        }
    var validationConfirmation = {
        recipient: {
            id: fbId
        },
        message: {
            text: ""
        }
    };
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            console.log("Validation Success: " + info.success);
            console.log(typeof(info.success));
            if (info.success == true) {
                console.log("[validateUser] Success!");
                if (token != null) {
                    /*con.query("INSERT INTO user_mapping(FB_ID, TOKEN, EMAIL) VALUES('" + fbId + "', '" + token + "', '" + email + "');", function(err, rows) {
                        if (err) throw err;
                        console.log('INSERT: Data received from Db:\n');
                        console.log(rows);
                        validationConfirmation.message.text = "Registraion successful. You can now use Aria."
                        //callSendAPI(validationConfirmation);
                        temptoken = token;
                    });*/
                }
            }
            else
            {
                validationConfirmation.message.text = "Registraion Failed. You entered the wrong verification code. "+
                    "You can restart the process of registration.";
                //callSendAPI(validationConfirmation);
            }
        }
    });
}

validateUser('vina@ideyatech.com', '1353975678010828', '2688588c-2372-48c6-ae4d-bab0e181cb6d');
