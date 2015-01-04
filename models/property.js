'use strict';

var nano    = require('nano')('http://localhost:5984');
var db      = nano.use("propmgt");
var orm     = require('../libs/orm');

//promise library
var qPromise = require("q");

var schema = new orm.Schema("Property");

var propNameType = new orm.types.String("PropName","Home");

schema.add(new orm.Field(propNameType,new orm.views.Input("PropName")));
schema.add(new orm.Field(new orm.types.String("PropAddrLine1","203 Clinton St."),new orm.views.Input("PropAddrLine1")));
schema.add(new orm.Field(new orm.types.String("PropAddrLine2",""),new orm.views.Input("PropAddrLine2")));

var query = new orm.Query(db,schema);

/*
query.insert(schema)
    .fail(function(err){console.log("Insert Failed",err);})
    .then(function(body){
        console.log("Insert Success",body);
    });*/
query.find.register(propNameType)
    .fail(function(err){console.log("Register Failed",err);})
    .then(function(){
        query.find.by.PropName("Home")
            .fail(function(err){console.log("Failed lookup",err)})
            .then(function(schemas){
                //console.log("Successful lookup",schemas);
                for(var x in schemas)
                    console.log(schemas[x].serialize());
            });
    });


var myModel = {
    name : {

    }
}

var PropertyModel = {
    model : {
        model:"PROPERTY",
        name:null,
        street1:null,
        street2:null,
        city:null,
        state:null,
        zip:null,
        photo:null
    },
    schema : {
        name : {}
    }
};

module.exports = PropertyModel;