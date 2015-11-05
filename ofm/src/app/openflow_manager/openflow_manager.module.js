define(['angularAMD', 'app/routingConfig', 'ui-bootstrap', 'Restangular', 'angular-translate', 'ngTable', 'ngSlider', /*'common/tagutils/tagutils.services', */'app/openflow_manager/modal/modal.controller', 'app/openflow_manager/modal/modaldelete.controller', 'common/authentification/auth.services', 'common/config/env.module', 'common/authentification/auth.module'], function() {

  var openflow_manager = angular.module('app.openflow_manager', ['ui.router.state','app.core', 'ui.bootstrap', 'restangular', 'pascalprecht.translate', 'ngTable', 'ngSlider', /*'app.common.tagUtils', */'app.modal', 'app.modaldelete']);

  openflow_manager.register = openflow_manager;

  openflow_manager.config(function ($stateProvider, $compileProvider, $controllerProvider, $provide, $translateProvider, NavHelperProvider, $filterProvider) {

    $translateProvider.useStaticFilesLoader({
      prefix: 'assets/data/locale-',
      suffix: '.json'
    });

    openflow_manager.register = {
      directive : $compileProvider.directive,
      controller : $controllerProvider.register,
      filter: $filterProvider.register,
      factory : $provide.factory,
      service : $provide.service
    };

    NavHelperProvider.addControllerUrl('app/openflow_manager/openflow_manager.controller');
    NavHelperProvider.addToMenu('Applications.openflow_manager', {
      "link": "#/openflow_manager/index",
      "active": "main.openflow_manager",
      "title": "OpenFlow Manager",
      "icon": "icon-level-down",
      "page": {
        "title": "OpenFlow manager",
        "description": "OpenFlow manager"
      }
    });

    var access = routingConfig.accessLevels;
      $stateProvider.state('main.openflow_manager', {
          url: 'openflow_manager',
          abstract: true,
          views : {
            'content' : {
              templateUrl: 'src/app/openflow_manager/views/root.tpl.html'
            }
          }
      });

      $stateProvider.state('main.openflow_manager.index', {
          url: '/index',
          access: access.admin,
          views: {
              '': {
                  controller: 'openflow_managerCtrl',
                  templateUrl: 'src/app/openflow_manager/views/index.tpl.html'
              }
          }
      });
      
      
  });

  return openflow_manager;
});
