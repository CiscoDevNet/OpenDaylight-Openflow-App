define(['app/openflow_manager/openflow_manager.module', 'app/openflow_manager/openflow_manager.services'], function(openflow_manager) {
   
  openflow_manager.register.directive('tableStats', ['$parse', 'FlowProperties', function ($parse, FlowProperties) {
    var paginationDirective = {
          restrict: 'E',
          replace: false,
          scope: {
              graphTableData: '=',
              tableType: '=',
              customFunc: '='
          },
          templateUrl: 'src/app/openflow_manager/views/tablestats.tpl.html',
          controller: ['$scope', 'ngTableParams', '$filter', function ($scope, ngTableParams, $filter) {
              var data = [],
                  tableParams = null,
                  tableDefer = null,
                  NgTableParams = ngTableParams,
                  columnPriorityOrder = ['deviceType','device'];

              $scope.columns = [];

              var parsedAttribute = function (attr, defaultValue) {
                        return function (scope) {
                            return $parse(el.attr('x-data-' + attr) || el.attr('data-' + attr) || el.attr(attr))(scope, {
                                $columns: columns
                            }) || defaultValue;
                        };
                    };

              var getData = function() {
                  // $scope.columns = $scope.graphTableData.length ? $scope.graphTableData[0]['stats-array'][] : [];
                  var columnToShow = [];
                  columnToShow = $scope.columns.map(function(column){
                                        if (column.show) {
                                          return column.name;
                                        }
                                      });
                  $scope.columns = [];

                  if ( $scope.graphTableData.length && $scope.graphTableData[0]['stats-array'].length ){
                      var count = 0;
                      for( var prop in $scope.graphTableData[0]['stats-array'][0] ){

                          var column = {
                            name: prop,
                            show: count < 4 || columnToShow.indexOf(prop) !== -1 ? true : false,
                            custsortable: prop.replace(/-/g,'')
                          };

                          $scope.columns.push(column);
                          count++;
                      }
                  }

                  var data = [];
                  $scope.graphTableData.forEach(function(dev){
                    if ( dev['stats-array'] && dev['stats-array'].length ) {
                      dev['stats-array'].forEach(function(table){
                         data.push(table);
                      });
                    }
                  });

                  return data.length ? data : [];
              };

              var getDataLength = function() {
                  return getData() ? getData().length : 0;
              };

              var initTable = function() {
                  $scope.tableParams = new NgTableParams({
                      page: 1,
                      count: 15
                  }, {
                      total: getDataLength(),
                      counts: [10,15,20,25,30],
                      getData: function($defer, params) {
                          tableDefer = $defer;
                          tableParams = params;
                          var filteredData = getData();
                          var orderedData = params.sorting() ?
                                  $filter('orderBy')(filteredData, params.orderBy()) :
                                  filteredData;

                          params.total(getDataLength());
                          $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                      },
                      $scope: { $data: {} }
                  });
              };
              
              initTable();
              
              $scope.$watch('graphTableData', function(){
                if ( tableParams ) {

                  var totalItems = $scope.graphTableData && $scope.graphTableData[0] && $scope.graphTableData[0]['stats-array'].length ? $scope.graphTableData[0]['stats-array'].length : 0,
                      totalCounts = totalItems === 0 ? [] : [10,15,20,25,30];
                  tableParams.reload();
                  tableParams.total(totalItems);
                  tableParams.settings().counts = totalCounts;

                }
              });

              $scope.$watch('tableType', function(){
                $scope.customFunc();
                initTable();
              });
          }]
      };
      return paginationDirective;
   }]);
});