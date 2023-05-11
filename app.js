require("dotenv").config()
const express = require("express");
const ejs = require("ejs");
const  body_parser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportlocalmongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');




const app = express();
app.use(session({
  secret:"sojinmon",
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(body_parser.urlencoded({extended:true}));


mongoose.connect("mongodb://0.0.0.0:27017/userdb");


const userschema = new mongoose.Schema({
    username:String,
    password:String,
    secret:String
});

userschema.plugin(passportlocalmongoose);
userschema.plugin(findOrCreate);

const userdb = mongoose.model("userdb",userschema);

passport.use(userdb.createStrategy());
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    userdb.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
    return profile
  }
));



app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });



app.get("/",function(req,res){
  res.render("first.ejs");
})

app.get("/register",function(req,res){
  res.render("register.ejs")
})

app.get("/home",function(req,res){
  res.render("home.ejs")
})


  app.post("/register",function(req,res){
    console.log(req.body)
    userdb.register({username:req.body.username},req.body.password,function(err,user){
        
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            userdb.authenticate("local")(req,res,function(){
                res.redirect("/home");
            });
        }
    })
});

app.listen(3000,function(err){
  if(err){
    console.log(err);
  }
  else{
    console.log("running");
  }
})