define(['app/openflow_manager/modal/modaldelete.module', 'app/openflow_manager/modal/modaldelete.controller'], function(modal) {

  modal.register.factory('modalWinServicesDelete', ['$modal', 'OpenFlowManagerUtils', 'OpenFlowManagerConfigRestangular', 
    function($modal, OpenFlowManagerUtils, OpenFlowManagerConfigRestangular) {
      var svc = {},
          view_path =  'src/app/openflow_manager/modal/';

      svc.open = function (title, flows, labelCbk, successCbk) {
          var modalInstance = $modal.open({
            templateUrl: view_path + 'modaldelete.tpl.html',
            controller: 'modalDeleteCtrl',
            resolve: {
              title: function(){
                  return title;
              },
              flowNames: function(){
                  var flowNames = flows.map(function(flow) {
                        var reqData = OpenFlowManagerUtils.getReqDataForDeleteOperationalFlow(flow, flow.data.table_id);

                        return {'name' : labelCbk(flow), 
                                'url' : OpenFlowManagerConfigRestangular.configuration.baseUrl + (flow.operational === 2 ? '/restconf/operations/sal-flow:remove-flow' : '/restconf/config/opendaylight-inventory:nodes/node/'+flow.device+'/table/'+flow.data.table_id+'/flow/'+flow.data.id),
                                'data' : flow.operational === 2 ? reqData : ''
                              };
                  });

                  return flowNames;
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

  }]);

});