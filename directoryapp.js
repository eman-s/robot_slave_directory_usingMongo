const express = require('express');
const app = express();
const mustacheExpress = require('mustache-express');
const MongoClient = require('mongodb').MongoClient;
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const bodyParser = require('body-parser');

const url = 'mongodb://localhost:27017/robots';

// Register '.mustache' extension with The Mustache Express
app.engine('mustache', mustacheExpress());
//-^
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');
//-^
app.use(express.static('public'));


var findRobotsForHire = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('robots');
  // Insert some documents
  collection.find({"job": null}).toArray(function(err, result) {
    console.log("found ",result.length, " users")
    callback(result);
  });
}

var findAllRobots = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('robots');
  // Insert some documents
  collection.find().toArray(function(err, result) {
    console.log("found ",result.length, " users")
    callback(result);
  });
}
// Use connect method to connect to the server
MongoClient.connect(url, function(err, db) {
  console.log('error?', err);
  console.log("Connected successfully to server");

  findRobotsForHire(db, function() {
    console.log('the search is done. I\'m out.');
    db.close();
  });
});
//-^



app.get('/', function (req, res) {
  res.send('Hello World! It is now ' + (new Date()) + ` <a href="http://localhost:3000/robotindex">robot?</a>` );
});

app.get('/robotindex', function (req, res) {
  MongoClient.connect(url, function(err, db){
    findAllRobots(db, function(result){
      res.render('robots', {users : result} );
    });
  });
});

app.get('/robotsneedwork', function (req, res) {
  MongoClient.connect(url, function(err, db){
    findRobotsForHire(db, function(result){
      res.render('robots', {users : result} );
    });
  });
});

app.get('/robot/:id', function(req, res) {
  MongoClient.connect(url, function(err, db){
    findAllRobots(db, function(result){
      let robot = result.find(function(slave){
        return slave.username.toLowerCase() === req.params.id;
      });
      res.render('a_robot', robot);
    });
  });
});

app.listen(3000, function (){
  console.log('!!!ROBOT_HOUSEE!!!');
});
