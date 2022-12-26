//for local authentication we use this module
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

const User = require('../models/user');
const bcrypt = require('bcryptjs');

// ye phele user ko ko current user collection m dundega and
//will grab the id property of the user object
passport.serializeUser(function(user,done){
  done(null,user.id);
});

//user ko id ki help se find karega from user collection and
//generate cookie id in browser and will logged in the user
//till the session last
passport.deserializeUser(function(id,done){
  User.findById(id,function(err,user){
    done(null,user);
  });
});

passport.use(new localStrategy({
  usernameField: 'email',
  passwordField: 'password'
},function(email,password,done){
  User.findOne({email:email})
  .then(function(user){
    if(!user){
      return done(null,false);
    }
    bcrypt.compare(password,user.password,function(err,isMatch){
      if(err){
        throw done(err);
      }
      if(isMatch){
        return done(null,user);
      }
      else{
        return done(null,false);
      }
    });
  }).catch(function(err){
    console.log(err);
  });
}));
