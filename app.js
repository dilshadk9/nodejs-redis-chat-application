'use strict';
var express = require('express')
     ,http = require('http')
     ,path = require('path')
     ,redis = require('redis')
     ,client = redis.createClient()
     ,events = require('events')
     ,eventEmitter = new events.EventEmitter()
     ,validator = require('validator')
     ,bodyParser = require('body-parser')
     ,session = require('express-session')
     ,RedisStore = require('connect-redis')(session)
     ,fs = require('fs')
     ,app = express()
     ,store = redis.createClient()
     ,pub = redis.createClient()
     ,sub = redis.createClient()
     ,async = require("async")
     ,multer  =   require('multer')
     ,url = require('url')
     ,crypto = require('crypto')
     ,main = require('./main');

var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './public/uploads');
  },
  filename: function (req, file, callback) {
    if(file.mimetype !== 'image/png' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg'){
      return callback(null, '', new Error('Error in processing image file'));
    }
    else {
      var ext = path.extname(url.parse(file.originalname).pathname); // '.jpg'
      var filename = file.fieldname + '-' + Date.now() + ext;
      callback(null, filename);
      client.hmset(req.session.email, "profilePicture", filename);
    }
    
  }
});

var uploadFile = multer({ storage : storage}).single('profilePicture');

app.set('port', 3000);
app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: '8XNndcfn)MFWPh&4?KK]',
    // create new redis store.
    store: new RedisStore({ host: 'localhost', port: 6379, client: client}),
    saveUninitialized: false,
    resave: false
}));
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:' + app.get('port'));

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
app.use(function(req, res, next) {
   res.locals.query = req.query;
   res.locals.url   = req.originalUrl;
   res.locals.userSession = req.session;
   next();
});


/*
To create http server.
*/
var httpServer = require('http').createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(httpServer);

io.sockets.on('connection', function (socket) {
  
  sub.subscribe("chatting");

  sub.on("message", function (channel, message) {
      console.log("message received on server from publish " + channel);
      socket.send(message);
  });
  var currentEmail = '';
  //var membersOnline = {};
  socket.on("message", function (msg) {
    console.log(msg);
      if(msg.type == "chat"){
        console.log("in app");
        console.log(msg.message);
          pub.publish("chatting", msg.message);
      }
      else if(msg.type == "chatUser"){
          pub.publish("chatting","is connected in chat room:" + msg.user + ':' + msg.pic+ ':' + msg.username);
          store.sadd("onlineUsers", msg.email);
          currentEmail = msg.email;
          /*client.setbit('membersOnline', msg.id, 1);
          membersOnline.id = msg.id;*/
      }
  });

  socket.on('disconnect', function () {
      store.srem("onlineUsers", currentEmail);
      //client.setbit('membersOnline', membersOnline.id, 0);
      console.log('Disconnect');
  });

});

/*
To display the home page.
*/
app.get('/', function(req, res) {
 var response = {
      'pageTitle' : 'Node.js and Redis chat application'
    };
 res.render('index', response);   
});

/*
To display the chatroom window to chat with other members in the chat room.
*/
app.get('/chatroom', function(req, res) {
  if(req.session.email) {
     var response = {
      'pageTitle' : 'Welcome to chat room'      
      };
      res.render('chatroom', response);
  }
  else {
    res.redirect('login');    
  }
});

/*
To display the login form.
*/
app.get('/login', function(req, res) {

   if(req.session.email) {
    res.redirect('chatroom');
   }
   else {
      var response = {
          'pageTitle' : 'Login to chat room'
      };

     res.render('login', response);
   }
   
});

/*
To authenticate the user and check for valid username/email and password in redis database.
*/
app.post('/login', function(req, res) {

  var email = req.body.email;
  var password = req.body.password;
  var salt = req.body.salt;
  var passwordData = getSaltHashPassword(password,salt);
  password = passwordData.passwordHash;
  
  client.hmget(req.body.email, 'email', 'password', 'firstname', 'lastname', 'date_time', 'username', function(err, obj){
      if(err) throw err;
      if(obj[0] == email && obj[1] == password) {
        // set the email in session
        req.session.email = obj[0];
        req.session.firstname = obj[2];
        req.session.lastname = obj[3];
        req.session.date_time = obj[4];
        req.session.username = obj[5];
        res.redirect('profile');     
      }
      else 
      {
         client.hmget(req.body.email, 'email', 'password', 'firstname', 'lastname', 'date_time', 'username', function(err, obj){
           if(obj[5] == email && obj[1] == password) {
            // set the email in session
            req.session.email = obj[0];
            req.session.firstname = obj[2];
            req.session.lastname = obj[3];
            req.session.date_time = obj[4];
            req.session.username = obj[5];
            res.redirect('profile');     
          }
          else {
             res.redirect('/login?invalid=true');
          }
        });  
      }
  });  
  
});

/*
To display the user profile information on profile page.
*/
app.get('/profile',function(req,res){

  if(req.session.username) {
 
        client.hmget(req.session.email,'firstname','lastname','profilePicture',function(err,obj) {
          if(err){
            console.log('Error');
          }
          else {
            var response = {
              'pageTitle' : 'Your profile',
              'profilePicture': obj[2]
            };
            res.render('profile', response);
          }
        });
      
  }  
  else {
    res.redirect('login');
  }       

});

/*
To upload (or update if already exist) the profile picture of the user and store in redis database.
*/
app.post('/updateProfile',function(req,res){
    uploadFile(req,res,function(err) {
        if(err) {
            res.redirect('profile?error=true');
        }
        res.redirect('chatroom');
    });
});

/*
To get the user profile information from redis database using unique hash key.
*/
app.get('/getProfile', function(req, res) {
  if(req.session.email) {
      client.hmget(req.session.email,'username','firstname','lastname','gender','email','profilePicture','id',function(err,obj) {
        var profileData = {
        'username' : obj[0],
        'firstname' : obj[1],
        'lastname' : obj[2],
        'gender' : obj[3],
        'email' : obj[4],
        'profilePicture' : obj[5],
        'id' : obj[6]
        };
      res.send(profileData);
      res.end();
    }); 
  }
  else {
    res.send('Session expired. Please login again!');
  }
  
});

/*
To display the signup form.
*/
app.get('/signup', function(req, res) {
   var response = {
      'pageTitle' : 'Signup for chat room'
    };
   res.render('signup', response);
});

/*
To take all the input from the signup form and store in to redis database. 
It will also validate for unique username and email.
*/
app.post('/signup', function(req, res) {

    // Create autoincrement key it not exist.
    client.setnx('auto_id', 0);
    
    var valid = true;
    var username = req.body.username;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var gender = req.body.gender;
    var email = req.body.email;
    var password = req.body.password;
    var salt = getRandomString(16);
    var passwordData = getSaltHashPassword(password,salt);
    req.body.password = passwordData.passwordHash;
    req.body.salt = passwordData.salt;
    var confirm_password = req.body.confirm_password;
    req.body.date_time = Date.now();

    var errors = {};

    if(validator.isNull(username)){
        errors.username = 'Please enter username';
        valid = false;
    }

    if(validator.isNull(email) || !validator.isEmail(email)){
        errors.email = 'Email is invalid';
        valid = false;
    }
    if(validator.isNull(firstname) || !validator.isAlpha(firstname)){
      errors.firstname = 'Please enter firstname';
      valid = false;
    }
    if(validator.isNull(lastname) || !validator.isAlpha(lastname)){
      errors.lastname = 'Please enter lastname';
      valid = false;
    }
    if(validator.isNull(gender)){
      errors.gender = 'Please select gender';
      valid = false;
    }
    if(validator.isNull(password) || !validator.isLength(password,6,16)){
        errors.password = 'Password must be 6-8 character long.';
        valid = false;
    }
    if(validator.isNull(confirm_password) ||  password != confirm_password){
        errors.confirm_password = 'Please re-enter the same password';
        valid = false;
    }

    if(!valid){
      res.send({'valid' : valid, 'errors' : errors});
    }
    else {
      client.hmget(email,'email', function (err,obj) {
          if(obj[0] == email){
            errors.email = 'Email already exist in our records';
            res.send({'valid' : false, 'errors':errors});
          }
          else {
              client.hmget(username, 'username', function(err, obj) {
              if(obj[0] == username){
                errors.username = 'Username already exist in our records';
                res.send({'valid' : false, 'errors':errors});
              }
              else {
                eventEmitter.emit("createAccount", req, res);
              }
            });
          }
      });
    }

});

/*
To store the registration details in redis database.
*/
eventEmitter.on("createAccount", function(req, res){
  delete req.body.confirm_password;
  var auto_id = {};
  client.incr('auto_id', function(err, obj) {
    req.body.id = obj;
    client.hmset(req.body.username, req.body);
    client.hmset(req.body.email, req.body, function(err, obj) {   
      res.send({'valid' : true, 'message': "You have successfully created an account. Please login to continue."});
      res.end();  
    });

  });
});


/*
To logout from the application and destroy the session.
*/
app.get('/onlineUserCount',function(req,res) {
    /*client.bitcount('membersOnline', function(err, cnt) {
      res.send({'count': cnt})
    });*/
    if(req.session.email) {
      client.scard('onlineUsers', function(err, cnt) {
        res.send({'count': cnt})
      });  
    }
    else {
      res.send('Session expired. Please login again!');
    }
    
});

/*
To logout from the application and destroy the session.
*/
app.get('/logout',function(req,res) {
    req.session.destroy(function(err) {
        if(err) {
          console.log(err);
        }
        else {
          res.redirect('/login');
        }
    });
});


/*
To generate random string
*/
var getRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
};

/*
To generate encrypted string
*/
var getSaltHashPassword = function(password, salt){
    var value =  crypto.createHash('sha512').update(password).digest("hex");
    return {
        salt:salt,
        passwordHash:value
    };
};
