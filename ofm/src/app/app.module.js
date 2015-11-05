//----Temporary-------\\

// This is provided by the server.
// The path of all *.module.js go here. They are RequireJs module

var module = [
  'angularAMD',
  'app/core/core.module',
  'angular-translate',
  'angular-translate-loader-static-files',
  'angular-ui-router',
  'ocLazyLoad',
  'angular-cookies',
  'datatables',
//  'footable',
//  'footable-pagination',
  'angular-css-injector',
  'common/yangutils/yangutils.services',
  'common/yangutils/listfiltering.services',
  'common/authentification/auth.services',
  'app/openflow_manager/modal/modal.controller',
  'app/openflow_manager/modal/modaldelete.controller',
  'app/openflow_manager/openflow_manager.module',
  'common/layout/layout.module',
  'common/config/env.module',
  'common/yangutils/yangutils.module',
//  'common/tagutils/tagutils.module',
  ]; //needed module

// The name of all angularjs module
var e = [
  'ui.router',
  'oc.lazyLoad',
  'pascalprecht.translate',
  'angular.css.injector',
  'app.modal',
  'app.common.layout',
  'app.common.yangUtils',
//  'app.common.tagUtils',
  'app.modal',
  'app.modaldelete',
  'app.openflow_manager',
  'app.common.auth'
//  'app.tag_manager',
//  'app.pathman',
  // Submenu ordering for System Management
//  'app.features',
//  'app.licensing',
//  'app.users',
  //'app.log-level',
  // Submenu ordering for System Monitoring
//  'app.log-aggregator',
//  'app.metrics-aggregator',
//  'app.monit',
//  'app.common.sigmatopology'
];
//--------------------\\



define(module, function(ng) {
  'use strict';

  var app = angular.module('app', e);

  // The overall config is done here.
  app.config(function ($stateProvider, $urlRouterProvider, $ocLazyLoadProvider, $translateProvider, cssInjectorProvider) {

//    $urlRouterProvider.otherwise("/monit"); // set the default route
    $urlRouterProvider.otherwise("/openflow_manager/index"); // set the default route

    cssInjectorProvider.setSinglePageMode(true); // remove all added CSS files when the page change

    // set the ocLazyLoader to output error and use requirejs as loader
    $ocLazyLoadProvider.config({
      debug: true,
      asyncLoader: require
    });

    $translateProvider.preferredLanguage('en_US');
    
    
  });

  ng.bootstrap(app);

  console.log('bootstrap done (: ');

  return app;
});
