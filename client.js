var request = require('request');

var http = require('http');
console.log('start');
function sendLeaveDetails(fbId, userToken, date1, date2, leavetype,hours,reason)
{
   console.log('send leave');
    var options = {
        url: 'http://192.168.30.210:8080/opentides/chatbot-leave/fileleave',
        method: 'GET',
        qs: {
            "facebookId": fbId,
            "chatbotToken": userToken,
            "leaveData": "{ \"startDate\" :\"" + date1 + "\"," +
               "\"endDate\":\"" + date2 + "\"," +
               "\"leaveType\":\"" + leavetype + "\"," +
               "\"numberOfHours\":" + hours + "," +
               "\"reason\":\"" + reason +
            "\"}"
        }
    };
    console.log(options);
    var fileLeaveConfirmation = {
        recipient: {
            id: fbId
        },
        message: {
            text: "Your leave has been filed."

    }
    };
    request(options, function(error, response, body) {
        console.log(response.statusCode);
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            console.log("Filing Leave Success: " + JSON.stringify(body));
            /*console.log("Filing Leave Success: " + response);*/
            if (info.success == true) {
                console.log("[fileLeave] Success!");
                callSendAPI(fileLeaveConfirmation);

            } else {
                console.log("[fileLeave] Failed");
                tokenRequest.message.text = "Filing of leave Failed. Please follow the rules for filing of leaves"
                callSendAPI(fileLeaveConfirmation);
            }
        }
        else{
            console.log("<<<<<<<<FILE LEAVE  FAILED>>>>>>>>   ");
            tokenRequest.message.text = "Filing of leave Failed. HRMS Connection Error"
            callSendAPI(fileLeaveConfirmation);
            console.log("BODY : " + JSON.stringify(body));
        }
    });
}

sendLeaveDetails('1353975678010827', 'asds', '2017-02-27', '2017-02-27','LEAVE_TYPE_SICK', 8, 'i want');

console.log("DONE");
