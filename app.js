//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
//level 1 is simply checking matching password insertion with registered in DB
const encrypt = require('mongoose-encryption');//level2 : DB Encryption
var md5 = require('md5'); //level3 : Hashing Passwords
const bcrypt = require('bcrypt');//level 4 : Salting and hashing
const saltRounds = 10;


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/userDB' , {
  useNewUrlParser: true
});




var userSchema = new mongoose.Schema({
  email : String ,
  password: String
});

var secret = process.env.SECRET

// userSchema.plugin(encrypt, { secret: secret , excludeFromEncryption: ['email']});

const User = mongoose.model("user" , userSchema);

///////////
app.route("/")

.get((req , res) => {
  res.render("home.ejs")
})


///////////
app.route("/login")

.get((req , res) => {
  res.render("login.ejs")
})

.post((req , res) => {
  User.findOne(
    {
     email : req.body.username,
   } ,

   (err , foundUser) => {
     if(err){
       console.log("wrong")
       res.render("login.ejs")
     }
     else{
       if(foundUser){
         //console.log(foundUser.password)
         bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
           if(result){
             console.log("found user password matches inserted")
              res.render("secrets.ejs")
           }
          else{
            console.log("Password didn't match")
          }
         });
}
         else{
           console.log("nope")
           res.render("login.ejs")
         }
       }

     })
   })



///////////
app.route("/register")

.get((req , res) => {
  res.render("register.ejs")
})

.post((req , res) => {

  User.findOne({email : req.body.username} , (err , emailFound) => {
    if(emailFound) {
      res.render("login.ejs")
    }
    else if(err){
      res.send(err)
    }
    else{
      bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        const newUser = new User({
          email : req.body.username,
          password : hash
          //md5(req.body.password)
          // password : req.body.password
        })

        newUser.save((err) => {
          if(err) console.log(err)
          else{
            res.render("secrets.ejs")
          }
        })
    });



    }
  })

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
