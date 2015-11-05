require.config({
  baseUrl : 'src',
  urlArgs:'v1',
  waitSeconds: 0,
  paths : {
    'angular' : '../vendor/angular/angular',
    'angularAMD' : '../vendor/angularAMD/angularAMD',
//    'ngload' : '../vendor/angularAMD/ngload',
    'ui-bootstrap' : '../vendor/angular-bootstrap/ui-bootstrap-tpls.min',
//    'domReady' : '../vendor/requirejs-domready/domReady',
    'Restangular' : '../vendor/restangular/dist/restangular.min',
    'underscore' : '../vendor/underscore/underscore',
    'angular-ui-router' : '../vendor/angular-ui-router/release/angular-ui-router',
    'angular-css-injector' : '../vendor/angular-css-injector/angular-css-injector',
    'angular-cookies' : '../vendor/angular-cookies/angular-cookies.min',
    'angular-translate' : '../vendor/angular-translate/angular-translate.min',
    'angular-translate-loader-static-files' : '../vendor/angular-translate-loader-static-files/angular-translate-loader-static-files.min',
    'jquery' : '../vendor/jquery/jquery.min',
    'jquery-ui' : '../vendor/jquery-ui/jquery-ui.min',
//    'footable' : '../vendor/footable/dist/footable.min',
//    'footable-pagination' : '../vendor/footable/dist/footable.paginate.min',
    'd3' : '../vendor/d3/d3.min',
//    'vis' : '../vendor/vis/dist/vis.min',
    'ocLazyLoad' : '../vendor/ocLazyLoad/dist/ocLazyLoad',
    'ngTable' : '../vendor/ng-table/ng-table.min',
    'next': '../assets/js/next/next/js/next',
    'next-topology': '../assets/js/next/nexttopology/js/next-topology',
    'angular-dragdrop': '../vendor/angular-dragdrop/draganddrop',
    'ngSlider' : '../vendor/ng-slider/dist/ng-slider.min',
    'datatables': '../vendor/datatables/media/js/jquery.dataTables.min',
//    'sigma' : '../vendor/sigma/sigma.min',
//    'sigma-parsers-gexf' : '../vendor/sigma/plugins/sigma.parsers.gexf.min',
//    'sigma-forceAtlas2' : '../vendor/sigma/plugins/sigma.layout.forceAtlas2.min',
//    'sigma-dragNodes' : '../vendor/sigma/plugins/sigma.plugins.dragNodes.min',
//    'sigma-customShapes' : '../vendor/sigma/plugins/sigma.renderers.customShapes.min',
//    'ZeroClipboard' : '../vendor/zeroclipboard/dist/ZeroClipboard',
//    'ngClip' : '../vendor/ng-clip/src/ngClip'
  },

  shim : {
    'angularAMD' : ['angular'],
    'ocLazyLoad' : ['angular'],
    'Restangular' : ['angular', 'underscore'],
    'ui-bootstrap' : ['angular'],
    'angular-css-injector' : ['angular'],
    'angular-ui-router' : ['angular'],
    'angular-cookies' : ['angular'],
    'angular-translate': ['angular'],
    'angular-translate-loader-static-files' : ['angular-translate'],
    'ngload' : ['angularAMD'],
    'jquery' : {
      exports : '$'
    },
//    'jquery-ui' : ['jquery'],
    'angular' : {
        deps: ['jquery','jquery-ui'],
        exports: 'angular'
    },
//    'footable' : ['jquery'],
//    'footable-pagination' : ['footable'],
    'datatables' : ['jquery'],
//    'undescore' : {
//      exports : '_'
//    },
//    'sticky' : ['jquery', 'angular'],
//    'sigma-parsers-gexf' : ['sigma'],
//    'sigma-forceAtlas2' : ['sigma'],
//    'sigma-dragNodes' : ['sigma'],
//    'sigma-customShapes' : ['sigma'],
    'ngTable' : ['angular'],
    'next-topology': ['next'],
//    'angular-dragdrop' : ['angular'],
    'ngSlider' : ['angular'],
//    'ZeroClipboard': ['angular'],
//    'ngClip' : ['angular','ZeroClipboard']
  },

  deps : ['app/app.module']
//  deps : ['app/openflow_manager/openflow_manager.module']

});
