var modules = ['app/openflow_manager/modal/modal.module',
               'app/openflow_manager/modal/modal.services'];


define(modules, function(modal) {

    modal.register.controller('modalCtrl', function($modalInstance, $scope, title, successCbk, text, $sce) {

        $scope.title = title;
        $scope.text = text;

        $scope.ok = function () {
            $modalInstance.close(successCbk);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.renderHtml = function(html_code)
        {
            return $sce.trustAsHtml(html_code);
        };

    });

});

