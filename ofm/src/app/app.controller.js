define(['app/app.module'], function (app) {
  'use strict';

  app.register.controller('AppCtrl', function ($http, $rootScope, $state, $scope, $location, Auth, ENV, $window) {
    if ((!/chrom(e|ium)/.test($window.navigator.userAgent.toLowerCase())) && (!/firefox/.test($window.navigator.userAgent.toLowerCase()))){
       alert("Browser not supported. For best results, use Chrome browser or Firefox 34.0.0 and above.");
    }

    $rootScope.useMobile =
      function() {
        if( navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) ||
          navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) ||
          navigator.userAgent.match(/Windows Phone/i) ) {
          return true;
        }
        else {
          return false;
        }
      };
      
    $scope.broadcastFromRoot = function(bcName, data){
        $scope.$broadcast(bcName, data);
    };
   
    $scope.show = {
      menu: false
    };
    $scope.isCollapse = false;
    $scope.isState = function(name) {
      return $state.includes(name);
    };
    
    
    $scope.$on('invalidTokenEvent', function() {
      console.log("Invalid Token event");
        
    });
    
    Auth.login(ENV.odlUserName, ENV.odlUserPassword, function(){}, function(){});
    
  });
});
