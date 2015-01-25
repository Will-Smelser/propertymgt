var express = require('express');
var router = express.Router();

var Handlebars = require('handlebars');
var nano    = require('nano')('http://localhost:5984');
var db      = nano.use('propmgt');

var model     = new require('../models/property')(db);
var schema    = model.schema;
var query     = model.query;
var route     = model.route;
var view      = require("../libs/orm/view");


/* GET home page. */
router.get('/create', function(req, res) {
    view.create(schema,route,function(html){
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
            res.redirect(302,'read/'+body.id);
        });
});


router.get('/read/:id',function(req,res){
    query.find.by._id(req.params.id).then(function(doc){
        view.read(doc,route,function(html){
            res.send(html);
        });
    }).fail(function(err){
        req.flash('orm-desc-short','Read '+schema.getName()+' Entry Failed');
        req.flash('orm-desc-body',err);
        res.redirect(302,'/'+route+'/failure');
    });
});

router.get('/update/:id',function(req,res){
    query.find.by._id(req.params.id).then(function(doc){
        view.update(doc,route,function(html){
            var tpl = Handlebars.compile(html);

            //set values for template replacements
            var ctx = {_id:doc._id,_rev:doc._rev,values:{}};
            doc.each(function(field,idx){ctx.values[field.id]=field.getType().getValue();});

            //compile and send templates
            res.send(tpl(ctx));
        });
    }).fail(function(err){
        console.log(err);
        req.flash('orm-desc-short','Read '+schema.getName()+' Entry Failed');
        req.flash('orm-desc-body',err);
        res.redirect(302,'/'+route+'/failure');
    });
});

router.post('/update',function(req, res){
    var doc = schema.clone();

    //set the values
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
            res.redirect(302,'read/'+body.id);
        });
});


router.get('/delete/:id',function(req,res){
    query.find.by._id(req.params.id).then(function(doc){
        view.delete(doc,route,function(html){
            var tpl = Handlebars.compile(html);

            //set values for template replacements
            var ctx = {_id:doc._id,_rev:doc._rev,values:{}};

            //compile and send templates
            res.send(tpl(ctx));
        });
    }).fail(function(err){
        console.log(err);
    });
});

router.post('/delete',function(req, res){
    query.delete(req.body._id,req.body._rev)
        .fail(function(err){
            req.flash('orm-desc-short','Delete '+schema.getName()+' Entry Failed');
            req.flash('orm-desc-body',err);
            res.redirect(302,'failure');
        })
        .then(function(body){
            req.flash('orm-desc-short','Deleted  Entry');
            req.flash('orm-desc-body','Your entry was successfully removed.');
            res.redirect(302,'success');
        });
});

router.get('/success',function(req,res){
    view.success(schema,route,function(html){
        var tpl = Handlebars.compile(html);

        //set values for template replacements
        var ctx = {
            short:new Handlebars.SafeString(req.flash('orm-desc-short')),
            body :new Handlebars.SafeString(req.flash('orm-desc-body'))
        };

        //compile and send templates
        res.send(tpl(ctx));
    });
});

router.get('/failure',function(req,res){
    view.failure(schema,route,function(html){
        var tpl = Handlebars.compile(html);

        //set values for template replacements
        var ctx = {
            short:new Handlebars.SafeString(req.flash('orm-desc-short')),
            body :new Handlebars.SafeString(req.flash('orm-desc-body'))
        };

        //compile and send templates
        res.send(tpl(ctx));
    });
});

module.exports = router;