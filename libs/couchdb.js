'use strict';

var http = require('http');
var q = require("q");


console.log("loaded");

function CouchDb(){};

var couchDefaultSetup = {
    host : "localhost",
    port: 5984
};

module.exports = function(setup){
    if(typeof setup === "undefined" || setup === null)
        return new CouchDb;
    else if(typeof setup !== "undefined" && setup !== null){

        CouchDb.prototype.test = "hello";
        //console.log("set prototype",CouchDb,setup);
        var temp = new CouchDb;
        console.log("hello",temp);
        temp.host = setup;
        return temp;
    }

    return new couchDb;
};
