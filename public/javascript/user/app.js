(function(){

    var app = angular.module('UserApp',[]);

    app.config(function($interpolateProvider) {
        $interpolateProvider.startSymbol('//');
        $interpolateProvider.endSymbol('//');
    });

    //navigation
    app.controller('UserController',function(){
        this.view = 1;
        this.user = window.appData.user;
        this.currView = 1;
        this.isCurrentView = function(id){
            return this.view === id;
        };
        this.setCurrentView = function(id){
            this.view = id;
        };

        var scope = this;

    });

})();