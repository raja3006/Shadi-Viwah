// jshint esversion:6
// to install handle bars type {npm install --save express-handlebars}
const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// passport module is for whether the users are authenticat with facebook and google
const passport = require('passport');
//this module makes the object id phir uss object id se cookie banata h aur login data m kaam aata h ye
const cookieParser = require('cookie-parser');
// ye module useer ko logged in rakhega browser m
const session = require('express-session');
//maan lo ki user new account bana raha h aur email phele
//se hi database m h to vo email ab use nhi ho sakta to msg
//dikhana padega ki account already exist or confirm password ke
//time bhi msg dikhana padega
const flash = require('connect-flash');
//database m password bhejne se phele password encrypt
//karna padta hai
const bcrypt = require('bcryptjs');


//After requiring mongoose create a model folder
//Load Models
const Message = require('./models/message');
const User = require('./models/user');

const app = express();

//load keys files
const Keys = require('./config/Keys');

// Load helpers
const {requireLogin,ensureGuest} = require('./helpers/auth');

//use body parser middleware
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//configuration for authentication
app.use(cookieParser());
app.use(session({
  secret: 'mysecret',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function(req,res,next){
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});


// setup express static folder to serve js,css files
app.use(express.static('public'));
//make user global object
// local user ko humne global user bana diya h isse faisa ye
// h ki ab hum user ko kisi bhi template m use kar sakte h
app.use((req,res, next)=>{
  res.locals.user = req.user || null;
  next();
});
// load passport
require('./passport/facebook');
require('./passport/google');
require('./passport/local');
// connect to mLab MongoDB
mongoose.connect(Keys.MongoDB,{useNewUrlparser:true}).then(() => {
  console.log('server is connected to MongoDB');
}).catch(function(err){
  console.log(err);
});

// environment var for port
const port = process.env.PORT || 3000;

// setup view engine
app.engine('handlebars',exphbs.engine({defaultLayout:'main'}));
app.set('view engine','handlebars');

app.get('/',ensureGuest,function(req,res){
  res.render('home',{
    title:'Home'
  });
});

app.get('/about',ensureGuest,function(req,res){
  res.render('about',{
    title:'About'
  });
});

app.get('/contact',ensureGuest,function(req,res){
  res.render('contact',{
    title:'Contact'
  });
});

/*phele check hoga then data grab karenge dusre route se*/
app.get('/auth/facebook', passport.authenticate('facebook',{
  scope:['email']
}));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  succcessRedirect: '/profile',
  failureRedirect: '/'
}));

app.get('/auth/google' , passport.authenticate('google',{
  scope:['profile']
}));

// app.get('/auth/google', function(request, response, next) {
//     passport.authenticate('google', {scope: ['profile']})(request, response, next);
// });

app.get('/auth/google/callback',passport.authenticate('google',{
  succcessRedirect: '/profile',
  failureRedirect: '/'
}));


// app.get('/auth/facebook/callback',
//   passport.authenticate('google', { failureRedirect: '/' }),
//   function(req, res) {
//     res.redirect('/profile');
//   });


app.get('/profile' ,requireLogin,function(req,res){
  User.findById({_id:req.user._id}).then(function(user){
    if (user) {
      user.online = true;
      user.save(function(err,user){
        if(err){
          throw err;
        }
        else{
          res.render('profile',{
            title:'Profile',
            user:user
          });
        }
      });
    }
  });
});

app.get('/newAccount',function(req,res){
  res.render('newAccount',{
    title: 'SignUp'
  });
});

app.use('/signup',function(req,res){
  console.log(req.body);
  let errors = [];
  if(req.body.password !== req.body.password2){
    errors.push({text:'Password does not match'});
  }
  if(req.body.password.length < 5){
    errors.push({text:'Password must be atleast 5 characters'});
  }
  if(errors.length > 0){
    res.render('newAccount',{
      errors: errors,
      title: 'Error',
      fullname:req.body.username,
      email: req.body.email,
      password: req.body.password,
      password2: req.body.password2
    });
  }
  else{
    User.findOne({email:req.body.email})
    .then(function(user){
      if (user) {
        let errors = [];
        errors.push({text:'Email already exist'});
        res.render('newAccount',{
          title: 'Signup',
          errors:errors
        });
      }
      else{
        // Password salting adds random characters before
        // or after a password prior to hashing to obfuscate
        //the actual password.

        //Hashing is a one-way process that converts a
        //password to ciphertext using hash algorithms.
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);
        const newUser = {
          fullname: req.body.username,
          email: req.body.email,
          password: hash
        }
        new User(newUser).save(function(err,user){
          if(err){
            throw err;
          }
          if(user){
            let success = [];
            success.push({text:'You have successfully created account. You can login now'});
            res.render('home',{
              success: success
            });
          }
        });
      }
    });
  }
});

// app.post('/login',passport.authenticate('local',{
//   succcessRedirect: '/profile',
//   failureRedirect: '/loginErrors'
// }));

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/loginErrors' }),
  function(req, res) {
    res.redirect('/profile');
  });

app.get('/loginErrors',function(req,res){
  let errors = [];
  errors.push({text:'User Not Found or Password Incorrect'});
  res.render('home',{
    errors:errors
  });
});

app.get('/logout' , function(req,res){
  User.findById({_id:req.user._id})
  .then(function(user){
    user.online = false;
    user.save(function(err,user){
      if(err){
        throw err;
      }
      if(user){
        req.logout();
        res.redirect('/');
      }
    });
  });
});

app.post('/contactUs',function(req,res){
  console.log(req.body);
  // saving data into the database
  const newMessage = {
    fullname: req.body.fullname,
    email: req.body.email,
    message: req.body.message,
    date: new Date()
  }
  new Message(newMessage).save(function(err,message){
    if (err) {
      throw err;
    } else {
      Message.find({}).then(function(messages){
        if (messages) {
          res.render('newmessage',{
            title:'Sent',
            messages:messages
          });
        }else {
          res.render('noMessage',{
            title:'Not Found'
          });
        }
      });
    }
  });
});

app.listen(port,function(){
  console.log(`server is running on port ${port}`);
});
