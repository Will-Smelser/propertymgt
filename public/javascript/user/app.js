(function(){

    var app = angular.module('UserApp',[]);

    app.config(function($interpolateProvider) {
        $interpolateProvider.startSymbol('//');
        $interpolateProvider.endSymbol('//');
    });

    //navigation
    app.controller('UserController',['$http',function($http){
        this.messageGood = null;
        this.messageError = null;
        this.user = window.appData.user;

        //jquery should have already been loaded
        this.userTemp = $.extend({},this.user);

        this.currView = 1;
        this.isCurrentView = function(id){
            return this.currView=== id;
        };
        this.setCurrentView = function(id){
            this.currView = id;
        };

        this.validate = function(user){
            if(!window.UserModelShared.validate(user)){
                this.messageError("User information is invalid");
                return false;
            }
            return true;
        };

        //only called if user object is good
        var scope = this;
        this.updateUser = function(user){
            console.log("Called updateUser");

            this.messageGood=null;
            this.messageError=null;
            $http.put('/user',user)
                .success(function(data){
                    console.log(data);
                    scope.user = $.extend({},data);
                    scope.userTemp = $.extend({},data);
                    scope.messageGood = "Success!";
                })
                .error(function(data){
                    scope.messageError = data;
                });
        };

    }]);

})();