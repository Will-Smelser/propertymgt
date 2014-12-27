'use strict';

//var bcrypt  = require('bcrypt');
var crypto  = require('crypto');
var nano    = require('nano')('http://localhost:5984');
var express = require('express');
var extend  = require('node.extend');
var http    = require('http');

var db      = nano.use("propmgt");
var md5     = crypto.createHash('md5');

//promise library
var qPromise = require("q");

//load the shared model
var UserModel = require('./shared/user.js');


var UserModelExt = {
    model : {
        "role" : "USER",
        "model": "USER",
        "password" : null
    }
}

var User = extend({},UserModel,UserModelExt,
    {
    insert : function(user, req){
        var deferred = qPromise.defer();

        if(!req.session || !req.session.user || !this.validate(req.session.user)){
            deferred.reject(401);
            return deferred.promise;
        }

        if(!UserModel.validate(user)){
            deferred.reject(400);
            return deferred.promise;
        }

        //verify the user updating is the same user
        if(user._id === req.session.user._id || req.session.user.role === "ADMIN"){
            db.insert(user, null, function (error, info) {
                if(error){
                    console.log("_ERROR_",error);
                    deferred.reject(500);
                }else{
                    if(info && info.ok){
                        user._rev = info.rev;
                        req.session.user = user;
                        deferred.resolve(user);
                    }else{
                        deferred.reject(500);
                    }
                }
            });

        }else{
            deferred.reject(401);
        }

        return deferred.promise;
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
                request.session.user = body.rows[0].value;
                return callback(body, null);
            }

            callback(null,null);
        });

    },
    loggedIn : function(req){
        req.session.loggedIn;
    },
    getBySession : function(req){
        if(User.loggedIn(req)){
            return req.session.user;
        }
        return null;
    }
});

module.exports = User;
