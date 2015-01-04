'use strict';

var Q = require("q");

var Query = function(nanoDb, schema){

    this._getView =  function(){
        var deferred = Q.defer();
        nanoDb.get("_design/"+schema.getName(),function(err,body){
            if(err){
                deferred.reject(err);
            }else{
                deferred.resolve(body);
            }
        });
        return deferred.promise;
    };

    this._createView = function(schema,type){
        var deferred = Q.defer();

        //create the syntax for creating a view
        var result = {
            '_id'      : "_design/"+schema.getName(),
            'language' : "javascript",
            'views'    : {}
        };
        result.views["by"+type.id] = {
            map : "function(doc){\n\tif(doc.name==='"+schema.getName()+"'){\n\t\tfor(var x in doc.data){\n\t\t\tif(doc.data[x].id==='"+type.id+"') emit(doc.data[x].value,doc);\n\t\t}\n\t}\n}"
        };

        //lookup the current views
        this._getView()
            .then(function(body){
                //the schema.name existed, so the view might already exist
                body.views["by"+type.id] = result.views["by"+type.id];

                nanoDb.insert(body,null,function(err,body2){
                    if(err)
                        deferred.reject(err);
                    else
                        deferred.resolve(body2);
                });
            })
            .fail(function(err){
                if(err.error === "not_found"){
                    nanoDb.insert(result,null,function(err2,body){
                        if(err2)
                            deferred.reject(err2);
                        else
                            deferred.resolve(body);
                    });
                }else
                    deferred.reject(err);
            });
        return deferred.promise;
    }

    this.insert = function(schemaObj){
        var deferred = Q.defer();
        var serialized = schemaObj.serialize();
        nanoDb.insert(serialized,null,function(err,body){
            if(err)
                deferred.reject(err);
            else
                deferred.resolve(body);
        });
        return deferred.promise;
    }

    this.find = {
        by : {}
    }

    var self = this;
    this.find.register = function(type){
        var deferred = Q.defer();
        var ready = false;
        self._createView(schema,type)
            .then(function(body){
                ready = true;
                deferred.resolve();
            })
            .fail(function(err){
                deferred.reject(err);
            });

        //even if things failed we register this function
        self.find.by[type.id] = function(value){
            var deferred2 = Q.defer();
            if(!ready) console.log("Query.find.by."+type.id+" before ready.");

            nanoDb.view(schema.getName(),'by'+type.id,{key:value},function(err,body2){
                if(err)
                    deferred2.reject(err);
                else{
                    var result = [];
                    for(var x in body2.rows){
                        result.push(ORM.create(schema,body2.rows[x].value));
                    }
                    deferred2.resolve(result);
                }
            });
            return deferred2.promise;
        }
        return deferred.promise;
    }

    return this;
};

var ORM = {
        "Query" : Query,
        deserialize : function(serialized){
            var type = new this.types[serialized.type.type](null,null,null,null);
            type.deserialize(serialized.type);

            var view = new this.views[serialized.view.type](null,null,null,null);
            view.deserialize(serialized.view);

            return new this.Field(type,view);
        },
        Field : function(type,view){
            this.type = type;
            this.view = view;

            this.serialize = function(){
                return {
                    type : this.type.serialize(),
                    view : this.view.serialize()
                };
            };

            return this;
        },
        types : {
            String : function(id,value){
                if(typeof value === "undefined")
                    value = null;

                this.type = "String";
                this.value= value;
                this.id   = id;
                var self = this;

                this.serialize = function(){
                    return {type:"String",value:self.value,id:self.id};
                };

                this.deserialize = function(serialized){
                    self.value = serialized.value;
                    self.id    = serialized.id;
                };
                return this;
            }
        },
        views : {
            Input : function(cssClassName){
                this.type = "Input";
                this.name = cssClassName;
                var self = this;

                this.serialize = function(){
                    return {type:"Input",name:self.name};
                };

                this.deserialize = function(serialized){
                    self.name = serialized.name;
                };
                this.dom = function(){
                    return document.createElement("input").setAttribute("class", cssClassName);
                }
                return this;
            }
        },
        create : function(schema, data){
            var self = this;
            var newSchema = new this.Schema(data.name);
            schema.each(function(idx,field){
                var type = new self.types[field.type.type](null,null,null,null);

                //TODO: this needs improved
                //have to find the matching id, first we assume indexes are same
                if(field.type.id === null ||
                    (data.data[idx] && data.data[idx] !== null && data.data[idx].id === field.type.id)){
                    type.deserialize(data.data[idx]);
                }else{
                    for(var x in data.data){
                        if(data.data[x].id === field.type.id )
                            type.desialize(data.data[x]);
                    }
                }

                var newField = new self.Field(type,field.view);
                newSchema.add(newField);

            });

            if(typeof data._id !== "undefined")
                newSchema._id = data._id;
            if(typeof data._rev !== "undefined")
                newSchema._rev = data._rev;

            return newSchema;
        },
        Schema : function(name){
            var self = this;
            this.name = name;
            this.fields = [];
            return {
                getName : function(){
                    return self.name;
                },
                add : function(field){
                    self.fields.push(field);
                },
                serialize : function(){
                    var result = [];
                    for(var x in self.fields){
                        result.push(self.fields[x].type.serialize())
                    }
                    return {
                        name:self.name,
                        data:result
                    };
                },
                each : function(func){
                    for(var x in self.fields)
                        func(x,self.fields[x]);
                }
            };
        }
    };

module.exports = ORM;