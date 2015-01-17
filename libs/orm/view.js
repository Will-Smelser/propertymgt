'use strict'

var fs = require('fs');
var Handlebars = require('handlebars');

Handlebars.registerHelper('list', function(items, options) {

    var out = "<ul>";

    for(var i=0, l=items.length; i<l; i++) {
        out = out + "<li>" + options.fn(items[i]) + "</li>";
    }

    return out + "</ul>";
});

var View = function(viewFile, schema, callback){
    fs.readFile(viewFile,function(err,source){
        if(err){
            console.log(err);
            return;
        }
        var template = Handlebars.compile(source+"");
        var context = {
            viewElements : []
        };

        schema.each(function(field){
            context.viewElements.push({view:new Handlebars.SafeString(field.getView().serialize())});
        });

        var html = template(context);
        callback(html);
    })
};

module.exports = View;