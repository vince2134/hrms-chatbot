exports.answer = 42;

exports.init = function()
{
    console.log("FROM BASE TRIGGER");
}

exports.post = function()
{
    console.log("POST FROM BASE TRIGGER");
}

var http = require('http')

var body = JSON.stringify({
    foo: "bar"
})

var request = new http.ClientRequest({
    hostname: "hrmschatbot",
    port: 443,
    path: "/notifyusers",
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
    }
})
