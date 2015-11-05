var modules = ['app/openflow_manager/modal/modaldelete.module',
               'app/openflow_manager/modal/modaldelete.services'];


define(modules, function(modal) {

    modal.register.controller('modalDeleteCtrl', function($modalInstance, $scope, title, successCbk, flowNames, $sce) {

        $scope.title = title;
        $scope.flowNames = flowNames;

        $scope.ok = function () {
            $modalInstance.close(successCbk);
        };

        $scope.parseJson = function(text){
            return JSON.stringify(text, null, 4);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.renderHtml = function(html_code)
        {
            return $sce.trustAsHtml(html_code);
        };

    });

    modal.register.controller('delFlowLine', ['$scope', function($scope){
        $scope.expanded = false;
    }]);

});

