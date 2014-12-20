/**
 * Created by Will2 on 12/14/14.
 */

//var nano = require('nano')('http://localhost:5984');
var express = require('express');
var router = express.Router();

//var db = nano.use("propmgt");

var User = require("../models/user");

var neverProtect = ["/user/login","user/register","/user/"];

/* GET home page. */
router.get('*', function(req, res, next) {
    console.log("Called protect");

    for(var x in neverProtect){
        if(req.url === neverProtect[x])
            return next();
    }

    if(!req.session.loggedIn){
        return res.redirect("/user/login");
    }

    next();
    /*
    db.view('user','byName',{key:'admin'},function(err, body) {
            console.log(body);
    });

    db.get('_all_docs',{},function(err,body){
        if(!err) console.log(body);
    });
    */
    //next();
});

module.exports = router;