var mysql = require("mysql");

// First you need to create a connection to the db
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "ideyatech",
  database: "hrms_db"
});

con.connect(function(err){
    console.log("connecting to DB");
  if(err){
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established');
});

con.query('SELECT * FROM announcement',function(err,rows){
  if(err) throw err;

  console.log('Data received from Db:\n');
  console.log(rows);
    for (var i = 0; i < rows.length; i++) {
        console.log(rows[i].CODE);
        console.log(rows[i].NAME);
};
    
    con.end() 
});

