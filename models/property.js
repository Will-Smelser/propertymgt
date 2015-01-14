'use strict';

var nano    = require('nano')('http://localhost:5984');
var db      = nano.use("propmgt");
var orm     = require('../libs/orm2');
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
/*
var model = {
    PropName        : {Type:[orm.types.String,"Default Property Name"], View:[orm.views.Input]},
    PropAddrLine1   : {Type:[orm.types.String], View:[orm.views.Input,{pattern:"[\w]+"}]},
    PropAddrLine2   : {Type:[orm.types.String], View:[orm.views.Input]},
    PropCity        : {Type:[orm.types.String], View:[orm.views.Input]},
    PropState       : {Type:[orm.types.String], View:[orm.views.SelectBoxState]},
    PropZip         : {Type:[orm.types.String], View:[orm.views.Input,{pattern:"[\d]+"}]}
};



var schema = new orm.Schema("Property",model);


var query = new orm.Query(db,schema);

query.find.register(schema.getField("PropName")).then(function(){

    query.find.by.PropName("Home")
        .then(function(schemas){
            var temp = schemas.shift();
            console.log(temp.serialize());
        }).fail(function(err){
            console.log(err);
        });

});

var obj = schema.clone();
//console.log(obj.serialize());
//console.log(schema.serialize());

//obj.setType(new orm.types.String("PropCity", "Type","City Name"));
obj.setPropAddrLine1("Some addr line");
console.log(obj.serialize());

//var schema2 = orm.create(schema,test);
//console.log(schema2.serialize());

//console.log(schema.getField("PropCity").getView());


//console.log(schema.serialize());

//console.log(schema.getField("PropAddrLine1").view.toString());
//console.log(schema.serialize());

/*
var field = new orm.Field(new orm.types.String("PropAddrLine1","203 Clinton St."),[new orm.views.Input("PropAddrLine1")]);
console.log(field.serialize());
var field2 = new orm.deserialize(field.serialize());
console.log(field2.serialize());
*/

var model = {
    PropName        : {Type:[orm.types.String,"Default Property Name"]},
    PropAddrLine1   : {Type:[orm.types.String]},
    PropAddrLine2   : {Type:[orm.types.String]},
    PropCity        : {Type:[orm.types.String]},
    PropState       : {Type:[orm.types.String]},
    PropZip         : {Type:[orm.types.String]}
};

var schema = orm.Schema("Property", model);
var doc = schema.clone();

console.log(doc.serialize());
doc.getField("PropName").setType(new orm.types.String("Hello Prop Name"));

//console.log(doc.getField("PropName").getType().serialize("PropName"));

var query = new orm.Query(db,schema);

query.find.register(schema.getField("PropState")).then(function(){

    //query.find.by.PropName("Home")
    query.find.by.PropState("OH")
        .then(function(schemas){
            console.log(">>",schemas.length);

            var temp = schemas.shift();
            temp.getField("PropName").setType(new orm.types.String("My Home"));
            //console.log(temp.serialize());


            query.insert(temp)
                .then(function(body){
                    console.log("INSERT SUCCUSESS",body);
                })
                .fail(function(err){
                    console.log("INSERT FAIL",err);
                });

        }).fail(function(err){
            console.log(err);
        });

});

//var field = new orm.Field("TestField",new orm.types.String("hello"));
//schema.addField(field);

//console.log(schema.serialize().data[0].value);

//schema.getField("TestField").setType(new orm.types.String("world"));
//console.log(schema.serialize().data[0].value);

//var clone = schema.clone();
//clone.getField("TestField").setType(new orm.types.String("Hello World"));
//console.log(clone.serialize().data[0].value);

//schema.deserialize(schema.serialize());

//console.log(schema.getField("TestField").getType().serialize());


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