'use strict';

//var nano    = require('nano')('http://localhost:5984');
//var db      = nano.use("propmgt");
//var orm     = require('../libs/orm/orm');

var ORM     = require('../libs/orm/orm');
var Query   = require('../libs/orm/query');

var model = {
    PropName        : {Type:[ORM.types.String],View:[ORM.views.Input,"Name"]},
    PropAddrLine1   : {Type:[ORM.types.String],View:[ORM.views.Input, "Address Line 1"]},
    PropAddrLine2   : {Type:[ORM.types.String],View:[ORM.views.Input, "Address Line 2"]},
    PropCity        : {Type:[ORM.types.String],View:[ORM.views.Input, "City"]},
    PropState       : {Type:[ORM.types.String],View:[ORM.views.Input, "State"]},
    PropZip         : {Type:[ORM.types.String],View:[ORM.views.Input, "Zip"]}
};


module.exports = function(db){
    var schema  = new ORM.Schema("Property", model);
    var query   = new Query(db,schema,ORM);

    //register searches
    query.find.register(schema.getField("PropState"));

    return {
        schema : schema,
        query  : query,
        route  : 'propmgmt'
    };
};