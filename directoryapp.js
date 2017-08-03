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
//configure body-parser
app.use(bodyParser.urlencoded({
  extended: false
}));

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.authenticate(username, password, function(err, user) {
            if (err) {
                return done(err)
            }
            if (user) {
                return done(null, user)
            } else {
                return done(null, false, {
                    message: "There is no user with that username and password."
                })
            }
        })
    }));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});


app.use(session({
    secret: 'this is a secret',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

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

// // Use connect method to connect to the server
// MongoClient.connect(url, function(err, db) {
//   console.log('error?', err);
//   console.log("Connected successfully to server");
//
//   findRobotsForHire(db, function() {
//     console.log('the search is done. I\'m out.');
//     db.close();
//   });
// });
// //-^



app.get('/', function (req, res) {
  res.send('Hello World! It is now ' + (new Date()) + ` <a href="http://localhost:3000/login">robot?</a>` );
});

app.get('/login', function (req,res){
  res.render('login')
})

app.post('/login', passport.authenticate('local',{
  successRedirect:'/robotindex',
  failureRedirect:'/'
}));

app.get('/register',function(req,res){
  res.render('register');
});

app.post('/register/', function(req, res) {
    req.checkBody('username', 'Username must be alphanumeric').isAlphanumeric();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();

    req.getValidationResult()
        .then(function(result) {
            if (!result.isEmpty()) {
                return res.render("register", {
                    username: req.body.username,
                    errors: result.mapped()
                });
            }
            const user = new User({
                username: req.body.username,
                password: req.body.password
            })

            const error = user.validateSync();
            if (error) {
                return res.render("register", {
                    errors: normalizeMongooseErrors(error.errors)
                })
            }

            user.save(function(err) {
                if (err) {
                    return res.render("register", {
                        messages: {
                            error: ["That username is already taken."]
                        }
                    })
                }
                return res.redirect('/');
            })
        })
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
