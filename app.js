//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const ejsLint = require('ejs-lint');
//level 1 is simply checking matching password insertion with registered in DB
// const encrypt = require('mongoose-encryption');//level2 : DB Encryption
// const md5 = require('md5'); //level3 : Hashing Passwords
// const bcrypt = require('bcrypt');//level 4 : Salting and hashing
// const saltRounds = 10;
const session = require('express-session')//level 5 : Session and cookies and passport auth
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');

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
  password: String
});

userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(encrypt, { secret: secret , excludeFromEncryption: ['email']});
const User = mongoose.model("user" , userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

app.listen(3000 , ()=>{
  console.log("server is on")
})
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
