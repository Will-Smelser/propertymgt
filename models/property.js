'use strict';

var nano    = require('nano')('http://localhost:5984');
var db      = nano.use("propmgt");
var orm     = require('../libs/orm');
/*
//promise library
var qPromise = require("q");

var schema = new orm.Schema("Property");

var propNameType = new orm.types.String("PropName","Home");

schema.add(new orm.Field(propNameType,new orm.views.Input("PropName")));
schema.add(new orm.Field(new orm.types.String("PropAddrLine1","203 Clinton St."),new orm.views.Input("PropAddrLine1")));
schema.add(new orm.Field(new orm.types.String("PropAddrLine2",""),new orm.views.Input("PropAddrLine2")));

var query = new orm.Query(db,schema);
*/
/*
query.insert(schema)
    .fail(function(err){console.log("Insert Failed",err);})
    .then(function(body){
        console.log("Insert Success",body);
    });*/
/*
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
*/

var model = {
    PropName        : {type:[orm.types.String,"Test Property"], view:[orm.views.Input]},
    PropAddrLine1   : {type:[orm.types.String,"Some line 1"], view:[orm.views.Input,{pattern:"[\w]+"}]},
    PropAddrLine2   : {type:[orm.types.String,"Some line 2"], view:[orm.views.Input]},
    PropCity        : {type:[orm.types.String,"City"], view:[orm.views.Input]},
    PropState       : {type:[orm.types.String,"State"], view:[orm.views.Input]},
    PropZip         : {type:[orm.types.String,"Zip"], view:[orm.views.Input]}
};

var schema = new orm.Schema("Property",model);
var query = new orm.Query(db,schema);
//query.find.register(schema.getField("PropName"));

var obj = schema.clone();
console.log(schema.serialize());

obj.setType(new orm.types.String("PropName",["Update Name"]));
console.log(obj.serialize());

var test = { name: 'Property', data:[
    { type: 'String', value: 'line1', id: 'PropName' },
    { type: 'String', value: 'line2', id: 'PropAddrLine1' },
    //{ type: 'String', value: 'line3', id: 'PropAddrLine2' },
    { type: 'String', value: 'line4', id: 'PropCity' },
    { type: 'String', value: '', id: 'PropState' },
    { type: 'String', value: 'Zip', id: 'PropZip' }
]};
var schema2 = orm.create(schema,test);
console.log(schema2.serialize());

/*
query.find.by.PropName("Home")
    .then(function(schemas){
        for(var x in schemas)
            console.log(schemas[x].serialize());
    });
*/
//console.log(schema.serialize());

//console.log(schema.getField("PropAddrLine1").view.toString());
//console.log(schema.serialize());

/*
var field = new orm.Field(new orm.types.String("PropAddrLine1","203 Clinton St."),[new orm.views.Input("PropAddrLine1")]);
console.log(field.serialize());
var field2 = new orm.deserialize(field.serialize());
console.log(field2.serialize());
*/
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