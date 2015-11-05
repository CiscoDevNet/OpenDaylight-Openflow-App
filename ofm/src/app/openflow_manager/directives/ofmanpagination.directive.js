define(['app/openflow_manager/openflow_manager.module', 'app/openflow_manager/openflow_manager.services'], function(openflow_manager) {
   
  openflow_manager.register.directive('ofmanPagination', ['$parse', 'FlowProperties', function ($parse, FlowProperties) {
    var paginationDirective = {
          restrict: 'E',
          replace: false,
          scope: {
              data: '=',
              labelCbk: '=',
              actSelected: '=',
              errorCbk: '=',
              currentDisplayIndex: '=',
              deleteElement: '='
          },
          templateUrl: 'src/app/openflow_manager/views/pagination.tpl.html',
          controller: ['$scope', function ($scope) {
              var moveOffset = 1;

              $scope.displayOffsets = [-1, 0, 1];

              var selActData = function(data) {
                  $scope.actSelected = data;
              };

              $scope.getName = function(flow) {
                  return $scope.labelCbk(flow);
              };

              $scope.getError = function(flow) {
                return $scope.errorCbk(flow);
              };

              $scope.shiftDisplayNext = function() {
                  $scope.currentDisplayIndex = Math.min($scope.currentDisplayIndex + moveOffset, $scope.data.length - 2);
              };

              $scope.shiftDisplayPrev = function() {
                  $scope.currentDisplayIndex = Math.max($scope.currentDisplayIndex - moveOffset, 1);
              };

              $scope.showPrevButton = function() {
                 return $scope.currentDisplayIndex > 1;
              };

              $scope.showNextButton = function() {
                 return $scope.data && $scope.currentDisplayIndex < $scope.data.length - 2;
              };

              $scope.setActData = function(data) {
                  $scope.actSelected = data;
              };

              $scope.$watch('data', function(newData, oldData){
                  if(newData && newData.length) {
                      $scope.setActData(newData[newData.length - 1]);
                  }
              });
          }]
          // link: function (scope, element, attrs) {}
      };
      return paginationDirective;
   }]);
});