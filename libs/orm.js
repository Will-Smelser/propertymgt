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
        self.find.by[type.id] = function (id) {
            var deferred2 = Q.defer();
            if (!ready) console.log("Query.find.by." + type.id + " before ready.");

            nanoDb.view(schema.getName(), 'by' + type.id, {key: id}, function (err, body2) {
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

            var temp = new ORM[x][serialized[x].type]();
            temp.deserialize(serialized[x]);

            if (x.toLocaleLowerCase() === "types"){
                type = temp;
            }else
                others.push(temp);
        }
        return new ORM.Field(type, others);
    },
    Field: function (type, others) {
        if (typeof others !== "object" || typeof others.length === "undefined")
            others = [];

        this.type = type;
        this.others = others;

        //add a bunch of getters for others
        for (var x in this.others) {
            //console.log(this.others.length,"adding method","get"+this.others[x].name);
            this["get" + this.others[x].name] = function () {
                return this.others[x];
            }
        }

        this.getType = function(){
            return this.type;
        };

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
        String: function (value) {
            //static values
            this._class = "types";
            this.type = "String";
            this.id   = "Type";

            //set by user/model
            this.value = null;
            this.name = null; //unique name within a Field

            //members that should be serialized
            this.svals = ["type","id","name","value"];

            if (typeof value !== "undefined")
                this.value = value;

            this.serialize = function () {
                var result = {};
                for(var x in this.svals)
                    result[this.svals[x]] = this[this.svals[x]];
                return result;
            };

            this.deserialize = function (serialized) {
                for(var x in this.svals)
                    this[this.svals[x]] = (typeof serialized[this.svals[x]] !== "undefined")?serialized[this.svals[x]]:null;
            };

            return this;
        }
    },
    views: {
        Input: function (id, name, attributes) {
            this._class = "views";
            this.type = "Input";
            this.id = id;
            this.name = name;

            this.serialize = function () {
                return {type: "Input", id: this.id, name: this.name};
            };
            this.deserialize = function (serialized) {
                this.id = serialized.id;
                this.name = serialized.name;
            };
            this.toString = function () {
                //console.log(attributes);
                var result = '<input type="text" class="' + this.id + '" ';
                for (var x in attributes) {
                    result += x + '="' + attributes[x] + '" ';
                }
                return result + " />";
            }
            return this;
        },
        SelectBoxState: function (id, name, attributes, key) {
            var options = ['AK', 'AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

            this._class = "views";
            this.type = "SelectBoxState";
            this.id = id;
            this.name = name;
            this.key = key;

            var self = this;

            this.select = new ORM.views.SelectBox(id, name, attributes, options, key);
            this.serialize = function () {
                var temp = this.select.serialize();
                temp.type = this.type;
                return temp;
            }

            //need to fix this, pretty sloppy
            this.deserialize = function (serialized) {
                self.id = serialized.id;
                self.name = serialized.name;
                self.key = serialized.key;
                this.select.id = this.id;
                this.select.name = this.name;
                this.select.key = this.key;
            }
            this.toString = this.select.toString;

        },
        SelectBox: function (id, name, attributes, options, key) {
            this._class = "views";
            this.type = "SelectBox";
            this.id = id;
            this.name = name;
            this.options = options;
            this.key = key;

            this.serialize = function () {
                return {type: "SelectBox", id: this.id, name: this.name, options: this.options, key: this.key};
            };
            this.deserialize = function (serialized) {
                this.id = serialized.id;
                this.name = serialized.name;
                this.options = serialized.options;
                this.key = serialized.key;
            };
            this.toString = function () {
                var str = '<select class="' + this.id + '"';
                for (var x in attributes)
                    str += x + '="' + attributes[x] + '" ';
                str += '>';

                for (var x in options) {
                    var key = (typeof x === "number") ? options[x] : x;
                    var selected = (key === this.key) ? "selected" : "";
                    str += '<option value="' + key + '" ' + selected + '>' + options[x] + '</option>';
                }
                str += "</select>"
            }
            return this;
        }
    },
    _construct: function (constructor, args) {
        function F() {
            return constructor.apply(this, args);
        }

        F.prototype = constructor.prototype;
        return new F();
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

        //go through the data
        for (var x in data.data) {
            //lookup the field by the id
            var field = schema.getField(data.data[x].id);

            //create a new type using the given id
            var type = new ORM.types[data.data[x].type](data.data[x].id);
            type.deserialize(data.data[x]);
            type.id = field.type.id;
            type.name = field.type.name;
            newSchema.setType(type);
        }

        return newSchema;

    },
    Schema: function (name, config) {
        var self = this;
        this.name = name;
        this.fields = [];

        //the public schema object we return
        var result = {};

        //fill the fields from a config object
        if (typeof config === "object") {
            for (var id in config) {
                var type = null;
                var others = [];

                for (var name in config[id]) {
                    var args = config[id][name].slice(1);
                    var obj = config[id][name][0];

                    if (name.toLowerCase() === "type") {
                        type = ORM._construct(obj, args);
                        type.name = name;
                        type.id = id;

                        //need to create the setter for this unique id
                        result["set"+id] = function(){
                            var args2 = Array.prototype.slice.call(arguments);
                            this.setType(ORM._construct(obj,args2));
                        };
                    } else {
                        others.push(ORM._construct(obj, args));
                    }
                }
                self.fields.push(new ORM.Field(type, others));
            }
        }

        result.setType = function (type) {
            var temp = null;

            var x = null;
            for (x in self.fields)
                if (self.fields[x].type.id === type.id)
                    break;

            if (x === null) console.log("setType failed.  Could not find type (" + type.id + ") in Schema.")

            self.fields[x].type = type;
        };
        result.getName = function () {
            return self.name;
        };
        result.getField = function (typeId) {
            for (var x in self.fields) {
                if (self.fields[x].type.id === typeId) {
                    return self.fields[x];
                }
            }
        };
        result.add = function (field) {
            self.fields.push(field);
            this["set"+field.type.id] = function(){
                var args = Array.prototype.slice.call(arguments);

                var type = ORM._construct(ORM.types[field.type.type],args);
                type.name = field.type.name;
                type.id = field.type.id;
                this.setType(type);
            };
        };
        result.serialize = function () {
            var result = [];
            for (var x in self.fields) {
                result.push(self.fields[x].type.serialize())
            }
            return {
                name: self.name,
                data: result
            };
        };
        result.clone = function () {
            var name = self.name;
            var schema = new ORM.Schema(name);

            for (var x in self.fields) {
                schema.add(ORM.deserialize(self.fields[x].serialize()));
            }
            return schema;
        };
        result.each = function (func) {
            for (var x in self.fields)
                func(x, self.fields[x]);
        };
        return result;
    }
};

module.exports = ORM;