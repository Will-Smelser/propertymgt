'user strict'

var Q = require("q");

var Query = function (nanoDb, schema, ORM) {

    var self = this;

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
            if (err){
                self._log('Failed','insert',serialized);
                deferred.reject("Query failed.<br/>"+err.name+": "+err.error.replace('_',' '));
            }else{
                schemaObj._rev = body.rev;
                deferred.resolve(body);
            }
        });
        return deferred.promise;
    }

    this.delete = function (id,revision) {
        var deferred = Q.defer();
        nanoDb.destroy(id,revision,function(err,body){
            if (err){
                self._log('Failed','delete',id,revision);
                deferred.reject("Query failed.<br/>"+err.name+": "+err.error.replace('_',' '));
            }else{
                deferred.resolve(body);
            }
        });
        return deferred.promise;
    };

    this._log = function(msg,method,arg1,arg2,argN){
        var args = Array.prototype.slice.call(arguments);
        var msg  = args.shift();
        var func = args.shift();
        var str = msg + '.  Query.'+func+'(';
        var comma = '';
        for(var x in args){
            str +=  comma + args[x];
            comma = ',';
        }
        console.log(str+')');
    }

    this.find = {
        by: {}
    }

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
                self._log('Failed','find.register',field);
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

            var value = ORM._construct(ORM.types[field.getType().type],args).getValue();

            var deferred2 = Q.defer();
            if (!ready) console.log("Query.find.by." + field.id + " before ready.");

            nanoDb.view(schema.getName(), 'by' + field.id, {key: value}, function (err, body2) {
                if (err){
                    deferred2.reject("Query failed.<br/>"+err.name+": "+err.error.replace('_',' '));
                }else {
                    var result = [];
                    for (var x in body2.rows) {
                        if(schema.getName() !== body2.rows[x].name)
                            return deferred.reject('Requested object did not match schema('+schema.getName()
                                +' vs. '+body2.rows[x].name+').  Aborted.');

                        try{
                            var doc = schema.clone().deserialize(body2.rows[x].value);
                            doc._rev = body2.rows[x].value._rev;
                            doc._id  = body2.rows[x].value._id;
                            result.push(doc);
                        }catch(err){
                            return deferred.reject("Failed to construct object from database.<br/>"
                                +JSON.stringify(body2)+"<br/>"+err);
                        }
                    }
                    deferred2.resolve(result);
                }
            });
            return deferred2.promise;
        }
        return deferred.promise;
    }

    self.find.by._id = function(id){
        var deferred = Q.defer();
        nanoDb.get(id,function(err,body){
            if(err){
                deferred.reject("Query failed.<br/>"+err.name+": "+err.error.replace('_',' '));
            }else if(schema.getName() !== body.name){
                deferred.reject('Requested object did not match schema ('+schema.getName()
                    +' vs. '+body.name+' ).  Aborted.');
            }else{
                var doc = schema.clone();
                try{
                     doc = doc.deserialize(body);
                }catch(err){
                    return deferred.reject("Failed to construct object from database.<br/>"
                        +JSON.stringify(body)+"<br/>"+err);
                }
                deferred.resolve(doc);
            }
        });
        return deferred.promise;
    }

    return this;
};

module.exports = Query;