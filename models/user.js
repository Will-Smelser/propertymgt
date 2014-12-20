'use strict';

//var bcrypt  = require('bcrypt');
var crypto  = require('crypto');
var nano    = require('nano')('http://localhost:5984');
var express = require('express');

var db  = nano.use("propmgt");
var md5 = crypto.createHash('md5');

var UserModel = {
    "model" : "User",
    "name" : null,
    "password" : null,
    "role": null,
    "loggedIn" : false
};

var UserModelExt = {
    "error":false,
    "message":null
};

var User = {
    create : function(){
        var user = new UserModel;
        var ext = new UserModelExt;
        return {"User":user,"Ext":ext};
    },
    findById : function(id, callback){
        done(err, user);
    },
    findByName : function(name,callback){
        db.view('user','byName',{key:name},function(err, body) {
            callback(err,body);
        });
    },
    findByEmail : function(email, callback){
        db.view('user','byEmail',{key:email},function(err,body){
            callback(err,body);
        });
    },
    login : function(email, pass, request, callback){
        this.findByEmail(email, function(err, body){
            if(err)
                return callback(null,err);

            console.log(body);
            if(body.rows.length > 0 && crypto.createHash('md5').update(pass).digest("hex") === body.rows[0].value.password){
                request.session.loggedIn = true;
                request.session.name = body.rows[0].value.name;
                request.session.email = body.rows[0].value.email;
                request.session.role = body.rows[0].value.role;
                return callback(body, null);
            }

            callback(null,null);
        });

    },
    loggedIn : function(req){
        req.session.loggedIn;
    }
};


module.exports = User;
