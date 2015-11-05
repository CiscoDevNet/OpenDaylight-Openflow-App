define(['angularAMD'], function(ng) {
  var module = angular.module('app.common.finishRender', []);

  module.config(function($compileProvider) {
    module.register = {
      directive : $compileProvider.register
    };
  });

  module.directive('onFinishRender', function ($timeout) {
      return {
          restrict: 'A',
          link: function (scope, element, attr) {
              if (scope.$last === true) {
                  $timeout(function () {
                      scope.$emit('ngRepeatFinished');
                  });
              }
          }
      };
  });

  return module;
});
