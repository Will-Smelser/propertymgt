'use strict'

var Q = require("q");
var fs = require('fs');
var Handlebars = require('handlebars');


var View ={
    /**
     * Simplify the loading of multiple template files
     * @param target An array where add will store its results.
     * @returns {{_after: _after, add: add, execute: execute}}
     */
    deferLoading : function(target){

        var deferred = [];
        var loaded = 0;
        var position = 0;
        var promise = Q.defer();

        var ret = {
            _after : function(){
                if(++loaded < deferred.length)
                    return;

                promise.resolve();
            },
            /**
             * Read in a file and store in the given target.  If data is defined, file will be compiled into a
             * template and executed with data.  Otherwise the file as a string will be stored in target.
             * @param file The full path to file to load
             * @param data [optional] If data is sent, the file will be compiled into a template and executed with data
             */
            add : function(file, data){
                var defer = Q.defer();
                defer.promise.then(this._after);
                deferred.push(defer);

                (function(x){
                    fs.readFile(file,function(err,src){
                        if(err){
                            console.log(err);
                            return defer.reject();
                        }

                        if(data){
                            var tpl = Handlebars.compile(src+"");
                            target[x] = new Handlebars.SafeString(tpl(data));
                        }else
                            target[x] = src+"";

                        defer.resolve();
                    });
                })(position++)
            },
            execute : function(){
                return promise.promise;
            }
        };
        return ret;
    },
    create : function(schema, route, callback){
        this._doView(schema,'Create '+schema.getName(),'create',"/"+route+"/create",callback);
    },
    read : function(schema, route, callback){
        this._doView(schema,'View '+schema.getName(),'read',null,callback);
    },
    update : function(schema, route, callback){
        this._doView(schema,'Update '+schema.getName(),'update',"/"+route+"/update",callback);
    },
    delete : function(schema, route, callback){
        this._doView(schema,'Delete '+schema.getName(),'delete',"/"+route+"/delete",callback);
    },
    success : function(schema,route,callback){
        console.log('about to render success');
        this._doView(schema,'Success','success',"/"+route+"/success",callback);
    },
    failure : function(schema,route,callback){
        this._doView(schema,'Failure','failure',"/"+route+"/failure",callback);
    },
    _getTplName : function(type){
        switch(type){
            case 'create': return 'create.handlebars';
            case 'read'  : return 'read.handlebars';
            case 'update': return 'update.handlebars';
            case 'delete': return 'delete.handlebars';
            case 'success': return 'success.handlebars';
            case 'failure': return 'failure.handlebars';
        }
    },
    _doView : function(schema,title,type,action,callback){
        //temp location to hold responses
        var results = [];

        //what will be sent to template
        var context = {
            head : null, foot : null, nav : null,
            title : title,
            viewElements : [],
            action : action,
            values : {}
        };

        //load everything
        var loader = new View.deferLoading(results);

        //the main template
        loader.add(__dirname+"/views/crud/"+this._getTplName(type));

        //supporting templates
        loader.add(__dirname+"/views/head.handlebars");
        loader.add(__dirname+"/views/foot.handlebars");
        loader.add(__dirname+"/views/nav.handlebars");



        //the schema view templates
        if(type !== 'success' && type !== 'failure'){
            schema.each(function(field,idx){
                var data = field.getView().serialize();
                loader.add(__dirname+"/views/fields/"+data.views[type],data);
            });
        }


        loader.execute().then(function(){
            var template = Handlebars.compile(results.shift());

            context.head = new Handlebars.SafeString(results.shift());
            context.foot = new Handlebars.SafeString(results.shift());
            context.nav  = new Handlebars.SafeString(results.shift());

            //these were compiled template result and therefore are do not need escaped
            context.viewElements = results.slice(0);

            callback(template(context).replace(/\[\[/g,"{{").replace(/\]\]/g,"}}"));
        });
    }
};
module.exports = View;