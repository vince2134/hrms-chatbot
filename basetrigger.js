exports.answer = 42;

exports.start = function()
{
    console.log("Start of " + funcname);
}

exports.end = function(funcname)
{
    console.log("End of " + funcname);
}

/*var http = require('http')

var body = JSON.stringify({
    foo: "bar"
})

http.get('http://13.76.85.160:443/notifyusers', function(res){
    assert(200, res.statusCode)
    done();
});*/