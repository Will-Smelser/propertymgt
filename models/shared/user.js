/**
 * Used by node and angular
 * @type {{model: string, name: null, password: null, role: null}}
 */
var UserModelShared = {
    model : {
        "_id":null,
        "_rev":null,
        "name" : null,
        "email" : null,
        "model" : "USER",
        "password" : null,
        "role" : "USER"
    },
    validate : function(user){
        //check no terms are null or empty
        for(member in this.model){
            if(!user[member] || user[member].length === 0) return false;
        }

        var _email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!_email.test(user.email)) return false;

        return true;
    }
}

//so we can use this outside of node
if(typeof module !== "undefined")
    module.exports = UserModelShared;