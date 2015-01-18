'use strict'

var Q = require("q");
var fs = require('fs');
var Handlebars = require('handlebars');


var View ={
    deferLoading : function(target,callback){
        var files = [];
        var _data = [];
        var deferred = [];
        var loaded = 0;

        var ret = {
            _after : function(){
                if(++loaded < deferred.length) return;
                callback();
            },
            add : function(file,data){
                var defer = Q.defer();
                defer.promise.then(this._after);
                deferred.push(defer);
                files.push(file);
                _data.push(data);
            },
            execute : function(callback){
                for(var x in files){
                    (function(idx){
                        fs.readFile(files[idx],function(err,src){
                            if(err)
                                console.log(err);

                            var tpl = Handlebars.compile(src+"");
                            target.push(new Handlebars.SafeString(tpl(_data[idx])));
                            deferred[idx].resolve();
                        });
                    })(x);
                }
            }
        };
        return ret;
    },
    create : function(schema, callback){
        fs.readFile(__dirname+"/views/create.handlebars",function(err,source){
            if(err){
                console.log(err);
                return;
            }

            var context = {
                title : "Create "+schema.getName(),
                action : "/"+schema.getName().toLowerCase()+"/create",
                viewElements : []
            };
            var template = Handlebars.compile(source+"");

            var loader = new View.deferLoading(context.viewElements,function(){
                callback(template(context).replace(/\[\[/g,"{{").replace(/\]\]/g,"}}"));
            });
            schema.each(function(field){
                var data = field.getView().serialize();
                loader.add(__dirname+"/views/"+data.view,data);
            });
            loader.execute();
        })
    }
};
module.exports = View;