<<<<<<< HEAD
var Client = require('node-rest-client').Client;

var client = new Client();


var args = {
    parameters: {id : 32}
}

client.get("http://192.168.30.210:8080/opentides/chatbot-leave/get",  function (data, response) {
    console.log(data.toString('utf8'));
});
=======
var Client = require('node-rest-client').Client;
 
var client = new Client();
 

var args = {
    parameters: {id : 32}
}

client.get("http://192.168.30.210:8080/opentides/chatbot-leave/get",  function (data, response) {
    console.log(data);
});
>>>>>>> 2f7f3fefb39a7d9e9b5b2eb33dfd45014c9ea512
