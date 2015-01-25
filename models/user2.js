'use strict';

var ORM     = require('../libs/orm/orm');
var Query   = require('../libs/orm/query');

var model = {
    Name        : {Type:[ORM.types.String],View:[ORM.views.Input,"Name"]},
    Email       : {Type:[ORM.types.String],View:[ORM.views.Input, "Email"]},
    Password    : {Type:[ORM.types.String],View:[ORM.views.Input, "Password"]},
    Role        : {Type:[ORM.types.String],View:[ORM.views.Input, "Role"]}
};


module.exports = function(db){
    var schema  = new ORM.Schema("User", model);
    var query   = new Query(db,schema,ORM);
    query.find.register(schema.getField("Email"));

    return {
        schema : schema,
        query  : query
    };
};