var express    = require('express');
var port       = process.env.PORT || 7777;
var passport   = require('passport');
var Strategy   = require('passport-local').Strategy;
var session    = require('express-session');
var fileStore  = require('session-file-store')(session);
var bodyParser = require('body-parser');
var fs         = require('fs');
var sqlite3    = require('sqlite3').verbose();
var os         = require('os');

var args = process.argv.slice(2);

if(args == "install")
{
  var dbLocation = null;
  var db = null;

  if(os.platform() == 'darwin' || os.platform() == 'linux')
  {
    dbLocation = 'db/db.db';
  } else if (os.platform() == 'win32') {
    dbLocation = 'db\\db.db';
  }

  fs.stat(dbLocation, function(err, stat){
    if(err == null){
      console.log('Install has already run');
      return 0;
    } else if(err.code == 'ENOENT') {
      db = new sqlite3.Database(dbLocation);
      db.serialize(function(){
        db.run("CREATE TABLE IF NOT EXISTS users(ID INTEGER PRIMARY KEY AUTOINCREMENT, USERNAME TEXT NOT NULL, PASSWORD TEXT NOT NULL)");
      });
      var prompt = require('prompt');
      var schema = {
        properties: {
          username: {
            description: 'Enter username',
            required: true
          },
          password: {
            description: 'Enter password',
            hidden: true
          },
          confirm: {
            description: 'Confirm password',
            hidden: true
          }
        }
      }
      prompt.message = "";
      prompt.delimiter = "";
      prompt.start();
      prompt.get(schema, function(err, result){
        if(err) {
          console.log(err);
          return 1;
         }
         if(result.password == result.confirm)
         {
           var stmt = db.prepare("INSERT INTO users (USERNAME, PASSWORD) VALUES ( :user, :password)");
           stmt.bind(':user', 'result.username' );
           stmt.bind(':password', 'result.confirm');
           stmt.finalize();
         } else {
           console.log('Passwords do not match');
         }
      });
    } else {
      console.log('Err: ', err.code);
      return 1;
    }
  });

} else if(args == "start") {
  var db         = require('./db');
  passport.use(new Strategy(
    function(username, password, cb) {
      db.user.findByUsername(username, function(err, user) {
        if (err) { return cb(err); }
        if (!user) { return cb(null, false); }
        if (user.password != password) {
          return cb(null, false);
        }
        return cb(null, user);
      });
    }));

  passport.serializeUser(function(user, cb) {
    cb(null, user.id);
  });

  passport.deserializeUser(function(id, cb) {
    db.user.findById(id, function (err, user) {
      if (err) { return cb(err); }
      cb(null, user);
    });
  });

  var app = express();

  app.set('view engine', 'ejs');

  app.use(require('body-parser').urlencoded({ extended: true }));
  app.use(require('morgan')('dev'));
  app.use(require('cookie-parser')());
  app.use(session({
    store: new fileStore({logFn: function(){}}),
    secret: 'change me',
    resave: false,
    saveUninitialized: false
  }));

  app.use(passport.initialize());
  app.use(passport.session());


  app.get('/', function(req, res) {
    res.render('index');
  });

  app.get('/login', function(req, res) {
    res.render('login');
  });

  app.get('/admin',
    require('connect-ensure-login').ensureLoggedIn(),
    function (req, res){
      res.render('admin');
    }
  );

  app.post('/login', passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/login',
    failureFlash: true
  }));

  app.use(express.static(__dirname + '/public'));

  app.listen(port);

  console.log("Listening on " + port)
} else {
  console.log("Install: node collector.js install");
  console.log("Start:   node collector.js start");
}
