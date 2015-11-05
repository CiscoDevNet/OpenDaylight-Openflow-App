define(['angularAMD', 'ui-bootstrap', 'angular-translate'], function() {

  var modal = angular.module('app.modal', ['app.core', 'ui.bootstrap', 'pascalprecht.translate']);
  
  modal.register = modal;

  modal.config(function ($stateProvider, $compileProvider, $controllerProvider, $provide, $translateProvider, NavHelperProvider, $filterProvider) {

    modal.register = {
      directive : $compileProvider.directive,
      controller : $controllerProvider.register,
      filter: $filterProvider.register,
      factory : $provide.factory,
      service : $provide.service
    };

  });

  return modal;
});
