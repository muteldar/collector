var express    = require('express');
var port       = process.env.PORT || 7777;
var passport   = require('passport');
var Strategy   = require('passport-local').Strategy;
var session    = require('express-session');
var fileStore  = require('session-file-store')(session);
//var db         = require('./db');
var bodyParser = require('body-parser');
var fs         = require('fs');

var args = process.argv.slice(2);

if(args == "install")
{
  fs.stat('config.json', function(err, stat){
    if(err == null){
      console.log('Install has already run');
      return 0;
    } else if(err.code == 'ENOENT') {
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
           fs.writeFile('config.json','user:' + result.username + ' password:' + result.confirm);
         } else {
           console.log('Passwords do not match');
         }
      });
    } else {
      console.log('Err: ', err.code);
    }
  });

}

if(args == "start")
{
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
}
