/**
 * Created by Will2 on 12/14/14.
 */

//var nano = require('nano')('http://localhost:5984');
var express = require('express');
var router = express.Router();

//var db = nano.use("propmgt");

var User = require("../models/user");

var neverProtect = [/.*/];
    //"/",/\/user\/login/,/\/user\/register/,"/propmgmt",
    //"/propmgmt/create","/propmgmt/user","/propmgmt/usercreate","/propmgmt/view"];//,"/user/","/user/model","/user/app","/user"];

/* GET home page. */
router.all('*', function(req, res, next) {
    console.log("Called protect");

    for(var x in neverProtect){
        if(neverProtect[x].test(req.url))
            return next();
    }

    if(!req.session.loggedIn){
        switch(req.method.toUpperCase()){
            case "GET":
                return res.redirect("/user/login");
            default:
                res.status(401).send("Unauthorized - Please Login");
                return;
        }
    }

    next();
});


module.exports = router;