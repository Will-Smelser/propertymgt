'use strict';

var Query  = require('./query');

var ORM = {
    "Query": Query,

    Field: function (id, obj1, obj2, objN) {
        this.id = id;
        this.objs = Array.prototype.slice.call(arguments).slice(1);

        var self = this;

        for(var x in this.objs){

            self._field = self;
            (function(){
                var idx = x;
                self.objs[idx]._field = self;
                self["get"+self.objs[idx].id] = function(){
                    return self.objs[idx];
                };
                self["set"+self.objs[idx].id] = function(newObj){
                    newObj._field = self;
                    self.objs[idx] = newObj;
                };
            })();

        }

        this.serialize = function(){
            var result = {};

            for(var x in self.objs){
                result[self.objs[x]._class] = self.objs[x].serialize(self);
            }
            return result;
        };

        return this;
    },
    types: {
        String: function (value) {
            this.clazz = "types";
            this.type = "String";
            this.value = (typeof value === "undefined") ? "" : value;
            this.id = "Type";

            var self = this;

            /**
             * types are unique in they use the field id for id
             * @returns {{type: *, value: *[]}}
             */
            this.serialize = function(){
                return {id:self._field.id,type:this.type,value:[this.value]};
            }
            this.deserialize = function(serialized){
                return ORM._construct(ORM.types.String,serialized.value);
            }
            this.clone = function(){
                return new ORM.types.String(value);
            }
            this.getValue = function(){
                return this.value;
            }

            return this;
        }
    },
    views: {
        _clean : function(value){
            return value;
        },
        Input: function (attributes) {
            this.clazz = "views";
            this.type = "Input";
            this.id = "View";

            this.attributes = (typeof attributes === "undefined") ? {} : attributes;

            var self = this;
            this.serialize = function(){

                var ret = '<input ';

                if(typeof self.attributes.id === "undefined")
                    ret += 'id='+ORM.views._clean(self._field.id)+'" ';
                if(typeof self.attributes.class === "undefined")
                    ret += "class='ORM' "

                for(var attr in self.attributes)
                    ret += attr + '="' + self._clean(self.attributes[attr])+ '" ';

                return ret + ' value="'+ORM.views._clean(self._field.getType().getValue())+'" />';
            }
            this.clone = function(){
                return new ORM.views.Input(self.attributes);
            }
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
                var type = self.fields[x].getType().serialize();
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
                for(var y in self.fields[x].objs)
                    args.push(self.fields[x].objs[y].clone());

                schema.addField(ORM._construct(ORM.Field,args));
            }
            return schema;
        };

        result.each = function(fn){
            for(var x in self.fields)
                fn(self.fields[x]);
        }

        return result;
    }
};

module.exports = ORM;