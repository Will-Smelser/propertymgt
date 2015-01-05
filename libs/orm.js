'use strict';

var Q = require("q");

var Query = function (nanoDb, schema) {

    this._getView = function () {
        var deferred = Q.defer();
        nanoDb.get("_design/" + schema.getName(), function (err, body) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(body);
            }
        });
        return deferred.promise;
    };

    this._createView = function (schema, type) {
        var deferred = Q.defer();

        //create the syntax for creating a view
        var result = {
            '_id': "_design/" + schema.getName(),
            'language': "javascript",
            'views': {}
        };
        result.views["by" + type.id] = {
            map: "function(doc){\n\tif(doc.name==='" + schema.getName() + "'){\n\t\tfor(var x in doc.data){\n\t\t\tif(doc.data[x].id==='" + type.id + "') emit(doc.data[x].value,doc);\n\t\t}\n\t}\n}"
        };

        //lookup the current views
        this._getView()
            .then(function (body) {
                //the schema.name existed, so the view might already exist
                body.views["by" + type.id] = result.views["by" + type.id];

                nanoDb.insert(body, null, function (err, body2) {
                    if (err)
                        deferred.reject(err);
                    else
                        deferred.resolve(body2);
                });
            })
            .fail(function (err) {
                if (err.error === "not_found") {
                    nanoDb.insert(result, null, function (err2, body) {
                        if (err2)
                            deferred.reject(err2);
                        else
                            deferred.resolve(body);
                    });
                } else
                    deferred.reject(err);
            });
        return deferred.promise;
    }

    this.insert = function (schemaObj) {
        var deferred = Q.defer();
        var serialized = schemaObj.serialize();
        nanoDb.insert(serialized, null, function (err, body) {
            if (err)
                deferred.reject(err);
            else
                deferred.resolve(body);
        });
        return deferred.promise;
    }

    this.find = {
        by: {}
    }

    var self = this;
    this.find.register = function (field) {
        var type = field.type;
        var deferred = Q.defer();
        var ready = false;
        self._createView(schema, type)
            .then(function (body) {
                ready = true;
                deferred.resolve();
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        //even if things failed we register this function
        self.find.by[type.id] = function (value) {
            var deferred2 = Q.defer();
            if (!ready) console.log("Query.find.by." + type.id + " before ready.");

            nanoDb.view(schema.getName(), 'by' + type.id, {key: value}, function (err, body2) {
                if (err)
                    deferred2.reject(err);
                else {
                    var result = [];
                    for (var x in body2.rows) {
                        result.push(ORM.create(schema, body2.rows[x].value));
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
    "Query": Query,
    /**
     * Create a Field object from a serialized field
     * @param serialized
     * @returns {ORM.Field}
     */
    deserialize: function (serialized) {
        var type = null;
        var others = [];
        for (var x in serialized) {

            var temp = new ORM[x][serialized[x].type](null, null, null, null);
            temp.deserialize(serialized[x]);

            if (x === "types")
                type = temp;
            else
                others.push(temp);
        }
        return new ORM.Field(type, others);
    },
    Field: function (type, others) {
        if (typeof others !== "object" || typeof others.length === "undefined")
            others = [];

        this.type = type;
        this.others = others;

        var self = this;
        this.serialize = function () {
            var result = {};
            result[self.type._class] = this.type.serialize();

            for (var x in self.others)
                result[self.others[x]._class] = self.others[x].serialize();

            return result;
        };

        return this;
    },
    types: {
        String: function (id, args) {
            var value = null;
            if (args !== null && typeof args !== "undefined" && typeof args.length != "undefined" && args.length > 0)
                value = args[0];

            this._class = "types";
            this.type = "String";
            this.value = value;
            this.id = id;
            var self = this;

            this.serialize = function () {
                return {type: "String", value: self.value, id: self.id};
            };

            this.deserialize = function (serialized) {
                self.value = serialized.value;
                self.id = serialized.id;
            };
            return this;
        }
    },
    views: {
        Input: function (cssClassName, attributes) {
            this._class = "views";
            this.type = "Input";
            this.name = cssClassName;
            var self = this;

            this.serialize = function () {
                return {type: "Input", name: self.name};
            };

            this.deserialize = function (serialized) {
                self.name = serialized.name;
            };
            this.dom = function () {
                return document.createElement("input").setAttribute("class", cssClassName);
            }
            this.toString = function () {
                console.log(attributes);
                var result = '<input type="text" class="' + cssClassName + '" ';
                for (var x in attributes) {
                    result += x + '="' + attributes[x] + '" ';
                }
                return result + " />";
            }
            return this;
        }
    },
    /**
     * Clones a schema and then takes the json data
     * and updates the schema values with the data.
     * @param schema
     * @param data
     * @returns {*|Node|Tag|Block}
     */
    create: function (schema, data) {

        var newSchema = schema.clone();

        for(var x in data.data){
            var type = new ORM.types[data.data[x].type](data.data[x].id);
            type.deserialize(data.data[x])
            newSchema.setType(type);
        }

        return newSchema;
    },
    Schema: function (name, config) {
        var self = this;
        this.name = name;
        this.fields = [];

        //fill the fields from a config object
        if (typeof config === "object") {
            for (var name in config) {
                var type = null;
                var others = [];

                for(var x in config[name]){
                    var args = config[name][x].slice(1);
                    var obj = config[name][x][0];

                    if(x === "type"){
                        type = new obj(name,args);
                    }else{
                        others.push(new obj(name,args));
                    }
                }

                self.fields.push(new ORM.Field(type, others));
            }
        }

        return {
            setType : function(type){
                var temp = null;

                var x = null;
                for (x in self.fields)
                    if (self.fields[x].type.id === type.id)
                        break;

                if(x === null) console.log("setType failed.  Could not find type ("+type.id+") in Schema.")

                self.fields[x].type = type;
            },
            getName: function () {
                return self.name;
            },
            getField: function (typeId) {
                for (var x in self.fields) {
                    if (self.fields[x].type.id === typeId) {
                        return self.fields[x];
                    }
                }
            },
            add: function (field) {
                self.fields.push(field);
            },
            serialize: function () {
                var result = [];
                for (var x in self.fields) {
                    result.push(self.fields[x].type.serialize())
                }
                return {
                    name: self.name,
                    data: result
                };
            },
            clone : function(){
                var name = self.name;
                var schema = new ORM.Schema(name);
                for(var x in self.fields){
                    schema.add(ORM.deserialize(self.fields[x].serialize()));
                }
                return schema;
            },
            each: function (func) {
                for (var x in self.fields)
                    func(x, self.fields[x]);
            }
        };
    }
};

module.exports = ORM;