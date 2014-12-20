var user = require('../models/user');
var express = require('express');
var router = express.Router();

var appStr = function(){return '<script src="/javascript/user/app.js" ></script>';};

/* GET users listing. */
router.get('/', function(req, res) {
  user.findByEmail("willsmelser@gmail.com",function(err,user){
      console.log(user,err);
      var appData = JSON.stringify({"user":user.rows[0].value});
      res.render('user/index',{message:req.flash('message'),"appData":appData,"angularApp":appStr()});
  });
});

router.get('/login', function(req, res){
    res.render('user/login',{message:req.flash('message')});
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
    console.log(req.session);
    console.log(res.session);
    res.render('user/login_success',{username:req.session.name});
});


module.exports = router;
