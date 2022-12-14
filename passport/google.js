//jshint esversion:6
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');
const keys = require('../config/keys');

passport.serializeUser(function(user,done){
  return done(null,user.id);
});

passport.deserializeUser(function(id,done){
  User.findById(id,function(err,user){
    return done(err,user);
  });
});

passport.use(new GoogleStrategy({
  clientID: keys.GoogleClientID,
  clientSecret: keys.GoogleClientSecret,
  callbackURL: 'http://localhost:3000/auth/google/callback'
},(accessToken,refreshToken,profile,done)=>{
  console.log(profile);

  User.findOne({google:profile.id} , function(err,user){
    if (err) {
      return done(err);
    }
    if(user){
      return done(null,user);
    }
    else{
      const newUser = {
        firstname: profile.name.givenName,
        lastname: profile.name.familyName,
        image: profile.photos[0].value.substring(0,profile.photos[0].value.indexOf('?')),
        fullname: profile.displayName,
        google: profile.id
      }
      new User(newUser).save(function(err,user){
        if (err) {
          return done(err);
        }
        if (user) {
          return done(null,user);
        }
      });
    }
  });
}));
