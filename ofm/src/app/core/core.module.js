define(['angularAMD'], function() {
  var core = angular.module('app.core', []);

  core.config(function($controllerProvider, $compileProvider, $provide) {
    core.register = {
      controller: $controllerProvider.register,
      directive: $compileProvider.directive,
      factory : $provide.factory,
      service : $provide.service
    };
  });

  return core;

});
