//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// // const ejsLint = require('ejs-lint');
// //level 1 is simply checking matching password insertion with registered in DB
// // const encrypt = require('mongoose-encryption');//level2 : DB Encryption
// // const md5 = require('md5'); //level3 : Hashing Passwords
// // const bcrypt = require('bcrypt');//level 4 : Salting and hashing
// // const saltRounds = 10;
const session = require('express-session')//level 5 : Session and cookies and passport auth
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const findOrCreate = require('mongoose-findorcreate') //making the OAuth docs more than just psuedo code


let warningMSGLOGIN = ""
let warningMSGREGISTER = ""

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const secret = process.env.SECRET
app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: false
  // cookie: { secure: true }
}))

app.use(passport.initialize());
app.use(passport.session());



const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/userDB' , {
  useNewUrlParser: true
});

var userSchema = new mongoose.Schema({
  email : String ,
  password: String,
  googleId:String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)
// userSchema.plugin(encrypt, { secret: secret , excludeFromEncryption: ['email']});
const User = mongoose.model("user" , userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
    done(null, user._id);
    // if you use Model.id as your idAttribute maybe you'd want
    // done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


//google sign in
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLEID,
    clientSecret: process.env.GOOGLESECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//facebook sign in
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets",
    profileFields: ['id', 'displayName', 'email'],
    enableProof: true
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


///////////
app.route("/")

.get((req , res) => {
  res.render("home.ejs")
})


///////////
app.route("/login")

.get((req , res) => {
  res.render("login.ejs" , {
    warningMSGLOGIN : warningMSGLOGIN
  })
  warningMSGLOGIN = ""
})

.post( passport.authenticate('local', { failureRedirect: '/login' }),
     (req , res) => {
        res.redirect("/secrets")
     }
   )



///////////
app.route("/register")

.get((req , res) => {
  res.render("register.ejs" , {
    warningMSGREGISTER : warningMSGREGISTER
  })
  warningMSGREGISTER = ""
})

.post((req , res) => {
  User.register({username:req.body.username, active: false}, req.body.password , function(err, user) {
    if (err) {
       console.log("1 "+ err);
       let errmsg = err.toString();
       let errkey = errmsg.substring(0,errmsg.indexOf(':'));
       let errtype = errmsg.substring(errmsg.indexOf(':') + 1);

       if(errkey === "UserExistsError"){
         warningMSGLOGIN = errtype
         res.redirect("/login")
       }
       else if(errkey === "MissingPasswordError"){
         warningMSGREGISTER = errtype
         res.redirect("/register")
       }
       else{
         warningMSGREGISTER = errtype
         res.redirect("/register")
       }
      }

      else{
        var authenticate = User.authenticate();
        authenticate(req.body.username, req.body.password, function(err, result) {
          if (err) { "2 "+ console.log(err) }

          if(result){
            console.log("3 "+ result)
            res.redirect("/secrets")
          }

          // Value 'result' is set to false. The user could not be authenticated since the user is not active
        });
      }

  });

})

////////
app.route("/submit")

.get((req , res) => {
  res.render("submit.ejs")
})

.post((req , res) =>{

})



////////
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
  });


  /////////
  app.get('/auth/facebook',
  passport.authenticate('facebook', { authType: 'reauthenticate' , scope: ['user_friends', 'email'] }));

  app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect secrets.
        res.redirect('/secrets');
    });


////////
app.route("/secrets")

.get((req , res) => {
  //Checking if the user trying to access the page is a system user or not
  if(req.isAuthenticated()){
    res.render("secrets.ejs")
  }
  else{
    warningMSGLOGIN = "Please log in first to access the Secrets page. Not a member? sign up "
    res.redirect("/login")
  }
})

///////
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});




app.listen(3000 , ()=>{
  console.log("server is on")
})
