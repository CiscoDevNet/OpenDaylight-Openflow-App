define(['angularAMD', 'Restangular', 'common/config/env.module'], function(ng) {
  var general = angular.module('app.common.general', ['restangular', 'config']);

  general.config(function($controllerProvider, $compileProvider, $filterProvider, $provide) {
    general.register = {
      controller: $controllerProvider.register,
      directive: $compileProvider.directive,
      filter: $filterProvider.register,
      factory: $provide.factory,
      service: $provide.service
    };
  });

  return general;
});
