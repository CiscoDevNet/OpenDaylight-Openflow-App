define(['common/general/common.navigation.module'], function(common) {

  /*
  * Helper to set CSS class to active via ng-class using $location.path()
  * or $state.includes()
  */
  common.directive('isActive', function($compile) {
    return {
      restrict: 'A',
      replace: false,
      scope: {
        state: '@',
        stateParams: '=',
        stateActive: '@',
        url: '@'
      },

      controller: ['$scope', '$location', '$state', function ($scope, $location, $state) {
        $scope.$state = $state;
        $scope.$location = $location;
      }],
      compile: function() {
        return function (scope, iElement, iAttrs, controller) {
          var active;
          if (scope.state) {
            var state = scope.stateActive || scope.$state.current.name.split('.')[0];
            active = 'active: $state.includes(\'' + scope.state + '\')';
          } else if (scope.url) {
            active = 'active: url === $location.path()';
          } else {
            active = "false";
          }
          iElement.attr('ng-class', '{ ' + active  + ' }'); // Adding the ngClass
          iElement.removeAttr('is-active'); // Avoid infinite loop
          $compile(iElement)(scope);
        };
      }
    };
  });


  common.directive('brdAnchor', function ($compile, $rootScope) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        label: '@',
        state: '@',
        stateParams: '=',
        url: '@'
      },

      /* The idea is to support both state and url, to be able to set {active} either
      if stateActive matches via $state.includes() or if the url matches
      Change this into a actual href later on ? - see https://github.com/angular-ui/ui-router/issues/395
      */
      template: '<a href="" ng-click="doClick()">{{label}}</a>',
      controller: ['$scope', '$rootScope', '$location', '$state', function ($scope, $rootScope, $location, $state) {
        $scope.$location = $location;
        $scope.$state = $state;

        $scope.doClick = function () {
          var args = {
            label: $scope.label,
            state: $scope.state,
            stateParams: $scope.stateParams,
            url: $scope.url
          };

          $rootScope.$broadcast('event:navigation', args);

          if (!$scope.url && $scope.state) {
            var params = $scope.stateParams || {};
            $state.transitionTo($scope.state, params, { location: true, inherit: true, relative: $state.$current, notify: true });
          } else if ($scope.url) {
            $location.path($scope.url);
          }
        };
      }]
    };
  });


  common.directive('buttonCancel', function() {
      // Runs during compile
      return {
          restrict: 'E',
          replace: true,
          scope: {
              'btnLabel': '@label',
              'btnSize': '@size',
              'btnGlyph': '@glyph',
              'cancelFunc': '=function',
              'state': '@',
              'stateParams': '=',
          },
          template: '<button class="btn btn-{{size}} btn-danger" ng-click="doCancel()"><i class="icon-remove-sign"></i> {{label}}</button>',
          controller: ['$scope', '$state', function ($scope, $state) {
            $scope.label = $scope.btnLabel || 'Cancel';
            $scope.size = $scope.btnSize || 'md';
            $scope.glyph = $scope.btnGlyph || 'remove-circle';

            $scope.doCancel = function () {
              if (angular.isFunction($scope.cancelFunc)) {
                $scope.cancelFunc();
                return;
              }

              var params = $scope.stateParams || {};
              $state.transitionTo($scope.state, params, { location: true, inherit: true, relative: $state.$current, notify: true });

            };
          }]
      };
  });

  common.directive('buttonSubmit', function(){
    // Runs during compile
    return {
      restrict: 'E',
      replace: true,
      scope: {
        'btnLabel': '@label',
        'btnSize': '@size',
        'btnGlyph': '@glyph',
        'submitFunc': '=function',
        'form': '=form',
        'validator': '='
      },
      template: '<button class="btn btn-{{size}} btn-orange" ng-click="doSubmit()" ng-disabled="submitDisabled"><i class="icon-ok-sign"></i> {{label}}</button>',
      controller: ['$scope', function ($scope) {
        $scope.label = $scope.btnLabel || 'Submit';
        $scope.size = $scope.btnSize || 'md';
        $scope.glyph = $scope.btnGlyph || 'ok-circle';

        $scope.submitDisabled = true;

        $scope.doSubmit = function () {
          if ($scope.submitFunc) {
            $scope.submitFunc();
          }
        };

        $scope.toggle = function (newVal) {
          $scope.submitDisabled = newVal ? false : true;
        };


        // Setup a watch for form.$valid if it's passed
        if (!$scope.validator && $scope.form) {
          $scope.$watch('form.$valid', function (newVal, oldVal) {
            $scope.toggle(newVal);
          });
        }

        // This overrules the form watch if set - use with cauthion!
        if ($scope.validator && angular.isFunction($scope.validator)) {
          $scope.$watch(
            function() {
              return $scope.validator();
            },
            function(newVal, oldVal) {
              $scope.toggle(newVal);
            }
          );
        }

        // Lastly if none of the above goes we'll just enable ourselves
        if (!$scope.form && !$scope.validator) {
          $scope.submitDisabled = false;
        }
      }]
    };
  });


  common.directive('showSelected', function() {
    // Runs during compile
    return {
      restrict: 'E',
      replace: true,
      scope: {
        'data': '='
      },
      template: '<span>Selected: {{data.length}}</span>'
    };
  });

  common.directive('ctrlReload', function() {
    // Runs during compile
    return {
      replace: true,
      restrict: 'E',
      scope: {
        svc: '=service'
      },
      template: '<button class="btn btn-primary btn-xs" ng-click="svc.getAll()"><i class="icon-refresh"></i></button>',
      link: function ($scope, iElm, iAttrs, controller) {
        $scope.$on('evt:refresh', function() {
          $scope.svc.getAll();
        });
      }
    };
  });

  common.directive('ctrlDelete', function($rootScope) {
    // Runs during compile
    return {
      replace: true,
      restrict: 'E',
      template: '<button class="btn btn-danger btn-xs" ng-click="deleteSelected()" ng-disabled="gridOptions.selectedItems.length == 0"><i class="icon-remove"></i></button>',
      link: function($scope, iElm, iAttrs, controller) {
        var i = 0;
        var selected = $scope.gridOptions.selectedItems;

        // Fire up a evt:refresh event once done.
        $scope.deleteSelected = function () {
          angular.forEach(selected, function(value, key) {
            $scope.svc.delete(value).then(
              function () {
                i++;
                if (i == selected.length) {
                  $rootScope.$broadcast('evt:refresh');
                }
              }
            );
          });
        };
      }
    };
  });
});
