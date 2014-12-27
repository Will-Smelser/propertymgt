var user        = require('../models/user');
var express     = require('express');
var path        = require('path');
var router      = express.Router();


var appStr   = '<script src="/user/app" ></script>';
var modelStr = '<script src="/user/model" ></script>';

/* GET users listing. */
router.get('/', function(req, res) {
  user.findByEmail("willsmelser@gmail.com",function(err,user){
      console.log(user,err);
      var appData = JSON.stringify({"user":user.rows[0].value});
      res.render('user/index',{
          message:req.flash('message'),
          "appData":appData,
          "angularApp":appStr,
          "angularModel":modelStr
      });
  });
});

router.get('/login', function(req, res){
    res.render('user/login',{message:req.flash('message'),appData:"{}"});
});

router.post('/login', function(req, res){

    console.log(req.body.email,req.body.password);

    user.login(req.body.email, req.body.password, req, function(user,err){
        if(user !== null){

            return res.redirect("/user/login_success");
        }

        req.flash('message', 'Login Failed');
        res.redirect("/user/login");
    });
});

router.get('/login_success', function(req, res){
    res.render('user/login_success',{username:req.session.name,appData:"{}"});
});

router.get('/app',function(req,res){
    res.sendFile(path.resolve(__dirname+'/../public/javascript/user/app.js'));
});
router.get('/model',function(req,res){
    res.sendFile(path.resolve(__dirname+'/../models/shared/user.js'));
});

router.put('/',function(req,res){
    console.log("put request:",req.body);
    console.log("_id is:",req.body._id);
    user.insert(req.body,req)
        .then(function(user){
            console.log(user);
            res.send(JSON.stringify(user));
        })
        .fail(function(code){
            var message = code+" - Unknown Error";
            switch(code){
                case 400: message = "Invalid user data.  Try again.";break;
                case 401: message = "Unauthorized.  Please logout and try again.";break;
                case 500: message = "Internal Error.  Failed to save to database.";break;
            }
            console.log("fail called",message);
            res.status(code).send(message);
        });
});
module.exports = router;
