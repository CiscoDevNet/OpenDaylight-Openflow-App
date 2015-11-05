// This module is used to populate views from the index.tpl.html
// Each module will register html pages with the appropriate HelperProvider's and this module will take everything from those Helpers and fill the view.
define(['angularAMD' ,'angular-ui-router', 'ocLazyLoad', 'common/general/common.general.directives', 'common/general/common.navigation.directives','app/core/core.services'], function(app) {
  var layout = angular.module('app.common.layout', ['ui.router.state', 'app.core', 'app.common.general', 'app.common.navigation']);

  layout.config(function($stateProvider, $urlRouterProvider, $controllerProvider, $compileProvider, $provide, TopBarHelperProvider, NavHelperProvider, ContentHelperProvider) {
    $stateProvider.state('main', {
      url: '/',
      views : {
        'mainContent@' : {
          controller: 'AppCtrl',
          templateUrl : 'src/common/layout/index.tpl.html'
        },
//        'navigation@main' : {
//          template: NavHelperProvider.getViews(),
//          controller: 'NavCtrl'
//        },
//        'topbar@main' : {
//          template : TopBarHelperProvider.getViews()
//        },
        'content@main' : {
          template : ContentHelperProvider.getViews()
        }
      },
      resolve: {
        loadCtrl: ['$ocLazyLoad', function($ocLazyLoad) {
          return $ocLazyLoad.load({
            files: ['app/app.controller'].concat(TopBarHelperProvider.getControllers()).concat(NavHelperProvider.getControllers())
          });
        }]
      }
    });

    layout.register = {
      controller: $controllerProvider.register,
      directive: $compileProvider.directive,
      factory : $provide.factory,
      service : $provide.service
    };

  });

  return layout;

});
