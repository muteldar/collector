//
// Express and other includes
//
var express    = require('express');
var port       = process.env.PORT || 7777;
var passport   = require('passport');
var strategy   = require('passport-local').Strategy;
var session    = require('express-session');
var fileStore  = require('session-file-store')(session);
var bodyParser = require('body-parser');
var fs         = require('fs');
var os         = require('os');
var sqlite3    = require('sqlite3').verbose();
var passwordHS   = require('password-hash-and-salt');
//
// Set dbLocation per supported OS
//
if(os.platform() == 'darwin' || os.platform() == 'linux')
{
  dbLocation = 'db/db.db';
} else if (os.platform() == 'win32') {
  dbLocation = 'db\\db.db';
} else {
  dbLocation = 'Not Supported'
}
//
// Command Line argv
//
var args = process.argv.slice(2);
//
// Functions
//

//
// argv logic
//
if (dbLocation == 'Not Supported') {
  console.log('Sorry your OS ' + os.platform() + ' is not supported');
  return 0;
} else if(args == "install") {
  var dbSetup = null;
  fs.stat(dbLocation, function(err, stat){
    if(err == null){
      console.log('Install has already run');
      return 0;
    } else if(err.code == 'ENOENT') {
      var installPmpt = require('prompt');
      var installSchema = {
        properties: {
          username: {
            description: 'Enter username',
            required: true
          },
          password: {
            description: 'Enter password',
            required: true,
            hidden: true
          },
          confirm: {
            description: 'Confirm password',
            required: true,
            hidden: true
          },
          session: {
            description:  'Session secret',
            required: true,
            hidden: true
          }
        }
      }
      installPmpt.message = "";
      installPmpt.delimiter = "";
      installPmpt.start();
      installPmpt.get(installSchema, function(err, result){
        if(err) {
          console.log(err);
          return 1;
         }
         if(result.password == result.confirm)
         {
           dbSetup = new sqlite3.Database(dbLocation);
           dbSetup.serialize(function(){
             dbSetup.run("CREATE TABLE IF NOT EXISTS users(ID INTEGER PRIMARY KEY AUTOINCREMENT, USERNAME TEXT NOT NULL, PASSWORD TEXT NOT NULL)");
           });
           var pass = result.confirm;
           var passHash = [];
           passwordHS(pass.toString()).hash(function(error, hash) {
             if(error)
               throw new Error('Err: Hashing did not complete');
             passHash.hash = hash;
             dbSetup.serialize(function(){
              var stmt = dbSetup.prepare("INSERT INTO users (USERNAME, PASSWORD) VALUES (?,?)");
              stmt.run(result.username, passHash.hash);
              stmt.finalize();
              passHash, stmt = null;
             });
             dbSetup.close();
           });
         } else {
           console.log('Passwords do not match. Please run Install and try again.');
         }
      });
    } else {
      console.log('Err: ', err.code);
      return 1;
    }
  });
} else if(args == "start") {
  fs.stat(dbLocation, function(err, stat){
    if(err == null){
      var db = new sqlite3.Database(dbLocation);
      passport.use(new strategy(function(username, password, cb) {
        db.get('SELECT id, username, password FROM users WHERE username = ?', username, function(err, row) {
          if(!row) return cb(null, false);
          passwordHS(password).verifyAgainst(row.PASSWORD, function(error, verified) {
            if(error)
              throw new Error('Err: Error with hashing');
            if(!verified) {
              return cb(null, false);
            } else {
              return cb(null, row);
            }
          });
        });
      }));

      passport.serializeUser(function(user, cb) {
        console.log(user);
        return cb(null, user.ID);
      });

      passport.deserializeUser(function(id, cb) {
        db.get('SELECT ID, USERNAME FROM users WHERE ID = ?', id, function(err, row) {
          if (!row) return cb(null, false);
          return cb(null, row);
        });
      });

      var app = express();

      app.set('view engine', 'ejs');

      app.use(require('body-parser').urlencoded({ extended: true }));
      app.use(require('morgan')('dev'));
      app.use(require('cookie-parser')());
      app.use(session({
        store: new fileStore({logFn: function(){}}),
        secret: 'sessionSct',
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
        failureRedirect: '/login'
      }));

      app.use(express.static(__dirname + '/public'));

      app.listen(port);

      console.log("Listening on " + port)
    } else if(err.code == 'ENOENT') {
      console.log('Run "node collector.js install" before running start');
      return 1;
    } else {
      console.log('Err: ', err.code);
      return 1;
    }
  });
} else if(args == "uninstall") {
  fs.stat(dbLocation, function(err, stat){
    if(err == null){
      var uninstallPmpt = require('prompt');
      var uninstallSchema = {
        properties: {
          confirm: {
            description: 'Type confirm to confirm delete of database',
            required: true
          }
        }
      }
      uninstallPmpt.message = "";
      uninstallPmpt.delimiter = "";
      uninstallPmpt.start();
      uninstallPmpt.get(uninstallSchema, function(err, result){
        if(err) {
          console.log(err);
          return 1;
         }
         if(result.confirm == 'confirm')
         {
           fs.unlinkSync(dbLocation);
           return 0;
         } else {
           console.log('You must type confirm to fully uninstall');
         }
      });
    } else if(err.code == 'ENOENT') {
      console.log('Nothing to uninstall');
      return 1;
    } else {
      console.log('Err: ', err.code);
      return 1;
    }
  });
} else {
  console.log("Install: node collector.js install");
  console.log("Start:   node collector.js start");
}
