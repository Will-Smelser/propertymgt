var express = require('express');
var router = express.Router();

var database = "propmgt";
var Handlebars = require('handlebars');
var nano    = require('nano')('http://localhost:5984');
var db      = nano.use(database);

var model   = new require('../models/property')(db);
var schema  = model.schema;
var query   = model.query;
var view    = require("../libs/orm/view");


/* GET home page. */
router.get('/create', function(req, res) {
    view.create(schema,'propmgmt',function(html){
        var tpl = Handlebars.compile(html);
        var ctx = {values:{}};
        schema.each(function(field,idx){ctx.values[field.id]=""});
        res.send(tpl(ctx));
    });
});

router.post('/create',function(req, res){
    var doc = schema.clone();
    for(var id in req.body){
        doc.getField(id).getType().setValue(req.body[id]);
    }

    query.insert(doc)
        .fail(function(err){
            return res.send("Failed to insert. Error: "+err);
        })
        .then(function(body){
            res.redirect(301,'read/'+body.id);
        });
});


router.get('/read/:id',function(req,res){
    query.find.by._id(req.params.id).then(function(doc){
        view.read(doc,'propmgmt',function(html){
            res.send(html);
        });
    }).fail(function(err){
        console.log(err);
    });
});

router.get('/update/:id',function(req,res){
    query.find.by._id(req.params.id).then(function(doc){
        view.update(doc,'propmgmt',function(html){
            var tpl = Handlebars.compile(html);

            //set values for template replacements
            var ctx = {_id:doc._id,_rev:doc._rev,values:{}};
            doc.each(function(field,idx){ctx.values[field.id]=field.getType().getValue();});

            //compile and send templates
            res.send(tpl(ctx));
        });
    }).fail(function(err){
        console.log(err);
    });
});

router.post('/update',function(req, res){
    var doc = schema.clone();

    for(var id in req.body){
        if(id !== '_id' && id !== '_rev')
            doc.getField(id).getType().setValue(req.body[id]);
    }

    //have to set these
    doc._id = req.body._id;
    doc._rev = req.body._rev;

    query.insert(doc)
        .fail(function(err){
            return res.send("Failed to insert. Error: "+err);
        })
        .then(function(body){
            res.redirect(301,'read/'+body.id);
        });
});

module.exports = router;