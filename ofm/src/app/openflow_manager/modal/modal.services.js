define(['app/openflow_manager/modal/modal.module'], function(modal) {

  modal.register.factory('modalWinServices', function($modal) {
      var svc = {},
          view_path =  'src/app/openflow_manager/modal/';

      svc.open = function (title, text, successCbk) {
          var modalInstance = $modal.open({
            templateUrl: view_path + 'modal.tpl.html',
            controller: 'modalCtrl',
            resolve: {
              title: function(){
                  return title;
              },
              text: function(){
                  return text;
              },
              successCbk: function(){
                  return successCbk;
              }
            }
          });

          modalInstance.result.then(function (callback) {
            callback();
          }, function () {
            // $log.info('Modal dismissed at: ' + new Date());
          });
      };


      return svc;

  });

});