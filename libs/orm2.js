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

    /**
     *
     * @param schema The schema/document to save
     * @param fieldId The id for the field
     * @param idx The index of the value to search on
     * @returns {promise|defer.promise|Q.promise|fd.g.promise|qFactory.Deferred.promise}
     * @private
     */
    this._createView = function (schema, fieldId, idx) {
        var deferred = Q.defer();

        //create the syntax for creating a view
        var result = {
            '_id': "_design/" + schema.getName(),
            'language': "javascript",
            'views': {}
        };
        result.views["by" + fieldId] = {
            map: "function(doc){\n\tif(doc.name==='" + schema.getName() + "'){\n\t\tfor(var x in doc.data){\n\t\t\tif(doc.data[x].id==='" + fieldId + "') emit(doc.data[x].value,doc);\n\t\t}\n\t}\n}"
        };

        //lookup the current views
        this._getView()
            .then(function (body) {
                //the schema.name existed, so the view might already exist
                body.views["by" + fieldId] = result.views["by" + fieldId];

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
            else{
                schemaObj._rev = body.rev;
                deferred.resolve(body);
            }
        });
        return deferred.promise;
    }

    this.find = {
        by: {}
    }

    var self = this;

    /**
     * Register a search view.  This will take the field and call field.getType() and
     * create this.find.by[field.getType().id] = function(){};  The arguments passed into
     * this function should be the same arguments used to create Type you are search
     * @param field
     * @returns {promise|defer.promise|Q.promise|fd.g.promise|qFactory.Deferred.promise}
     */
    this.find.register = function (field) {
        var type = field.getType();
        var deferred = Q.defer();
        var ready = false;


        self._createView(schema, field.id)
            .then(function (body) {
                ready = true;
                deferred.resolve();
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        /**
         * Even if things failed we register this function.
         * Parameters should match the ORM.types.Type's arguments.  It will create the Type object
         * and then search the database for the serialized value of type.
         * @returns {promise|defer.promise|Q.promise|fd.g.promise|qFactory.Deferred.promise}
         */
        self.find.by[field.id] = function () {
            var args = Array.prototype.slice.call(arguments);
            var value = ORM._construct(ORM.types[field.getType().type],args).serialize().value;


            var deferred2 = Q.defer();
            if (!ready) console.log("Query.find.by." + field.id + " before ready.");

            nanoDb.view(schema.getName(), 'by' + field.id, {key: value}, function (err, body2) {
                if (err)
                    deferred2.reject(err);
                else {
                    var result = [];
                    for (var x in body2.rows) {
                        var doc = schema.clone().deserialize(body2.rows[x].value);
                        doc._rev = body2.rows[x].value._rev;
                        doc._id  = body2.rows[x].value._id;
                        result.push(doc);
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

    Field: function (id, obj1, obj2, objN) {
        this.id = id;
        this.objs = Array.prototype.slice.call(arguments).slice(1);

        var self = this;

        for(var x in this.objs){
            this["get"+this.objs[x].id] = function(){return this.objs[x];};
            this["set"+this.objs[x].id] = function(obj){self.objs[x] = obj;};
        }

        this.serialize = function(){
            var result = {};

            for(var x in self.objs){
                result[self.objs[x]._class] = self.objs[x].serialize(self.id);
            }
            return result;
        };

        return this;
    },
    types: {
        String: function (value) {
            this.clazz = "types";
            this.type = "String";
            this.value = value;
            this.id = "Type";

            /**
             * types are unique in they use the field id for id
             * @returns {{type: *, value: *[]}}
             */
            this.serialize = function(id){
                return {id:id,type:this.type,value:[this.value]};
            }
            this.deserialize = function(serialized){
                return ORM._construct(ORM.types.String,serialized.value);
            }

            return this;
        },
        Array: function(arg1, arg2, argN){
            this.clazz = "types";
            this.type = "Array";
            this.value = Array.prototype.slice.call(arguments);
            this.id = "Type";

            /**
             * types are unique in they use the field id for id
             * @returns {{type: *, value: *[]}}
             */
            this.serialize = function(id){
                return {id:id,type:this.type,value:[this.value]};
            }
            this.deserialize = function(serialized){
                return ORM._construct(ORM.types.String,serialized.value);
            }

            return this;
        }
    },
    views: {
        Input: function (id, name, attributes) {
            this.clazz = "views";
            this.type = "Input";

            this.id = id;
            this.name = name;
            this.attributes = attributes;
        }
    },
    _construct: function (constructor, args) {
        //for backwards compatability
        if(Object.prototype.toString.call( args ) !== '[object Array]')
            args = [].concat(args);
        function F() {
            return constructor.apply(this, args);
        }

        F.prototype = constructor.prototype;
        return new F();
    },
    Schema: function (name, config) {
        this.name = name;
        this.fields = [];

        //load the config
        for(var id in config){
            var objs = [id];
            for(var name in config[id]){
                var args = config[id][name].slice(1);
                objs.push(ORM._construct(config[id][name][0],args));
            }
            this.fields.push(new ORM._construct(ORM.Field,objs));
        }

        var self = this;
        var result = {};

        result.getName = function () {
            return self.name;
        };
        result.getField = function (id) {
            for(var x in self.fields){
                if(self.fields[x].id === id)
                    return self.fields[x];
            }
            return null;
        };
        result.addField = function (field) {
            self.fields.push(field);
            return this;
        };
        result.serialize = function () {
            var result = [];
            for (var x in self.fields){
                var type = self.fields[x].getType().serialize(self.fields[x].id);
                result.push(type);
            }

            //so we can make updates in couch, need to always set the _rev number
            var rtn = { name: self.name, data: result};
            if(typeof this._rev !== "undefined"){
                rtn._rev = this._rev;
                rtn._id = this._id;
            }

            return rtn;
        };
        result.deserialize = function(serialized){
            self.name = serialized.name;

            //iterate over the serialized data
            for(var x in serialized.data){
                //we have the field id, so lookup the field
                var field = this.getField(serialized.data[x].id);

                //Construct a new Type from serialized data
                field.setType(field.getType().deserialize(serialized.data[x]));
            }
            return this;
        };

        /**
         * Make a clone of the current schema.  This does not include a "_rev" values, so
         * if you run an insert in couch from a clone you will end up with a new document in the database
         * @returns {ORM.Schema}
         */
        result.clone = function () {
            var name = this.getName();
            var schema = new ORM.Schema(name);

            //iterate the fields
            for(var x in self.fields){
                var args = [self.fields[x].id];

                //iterate objects in given Field
                for(var y in self.fields[x].objs){
                    var temp = self.fields[x].objs[y].serialize(self.fields[x].id);
                    args.push(self.fields[x].objs[y].deserialize(temp));
                }

                schema.addField(ORM._construct(ORM.Field,args));
            }
            return schema;
        };
        return result;
    }
};

module.exports = ORM;