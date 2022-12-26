/*jshint esversion: 6
//facebook Strategy kuch nhi
bas facebook ke through authentication lena h*/
 const passport = require('passport');
 const facebookStrategy = require('passport-facebook').Strategy;
 const User = require('../models/user');
 const keys = require('../config/keys');

/*The user id (you provide as the second argument of the done
function) is saved in the session and is later used to retrieve
the whole object via the deserializeUser function.*/
//serializeUser determines which data of the user object should be stored in the session
 passport.serializeUser(function(user,done){
   done(null,user.id);
 });
/*The first argument of deserializeUser corresponds to
the key of the user object that was given to the done function.
So your whole object is retrieved with help of that key.
That key here is the user id (key can be any key of the user
object i.e. name,email etc). In deserializeUser that key is
matched with the in memory array / database or any data resource.*/
passport.deserializeUser(function(id,done){
  User.findById(id,function(err,user){
    done(err,user);
  });
});

/*facebookStrategy use kar rahe to phele clientID and
clientSecret se keys check hoga agar Strategy successful
hoti h to facebook url ke through user data bhejega*/
passport.use(new facebookStrategy({
  clientID: keys.FacebookAppID,
  clientSecret: keys.FacebookAppSecret,
  callbackURL: 'http://localhost:3000/auth/facebook/callback',
  profileFields: ['email','name','displayName','photos']
},function(accessToken, refreshToken, profile, done){
  console.log(profile);
  User.findOne({facebook:profile.id} , function(err,user){
     if (err) {
       return done(err);
     }
     if (user) {
       return done(null , user);
     }
     else {
       const newUser = {
         facebook: profile.id,
         fullname: profile.displayName,
         lastname: profile.name.familyName,
         firstname: profile.name.givenName,
         image: `https://graph.facebook.com/${profile.id}/photos?type=large`,
         email: profile.emails[0].value
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
