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

http.get('http://localhost:443/notifyusers', function(res){
    assert(200, res.statusCode)
    done();
});