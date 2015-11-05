define(['common/general/common.general.module'], function(general) {

  general.factory('GeneralRestangular', function(Restangular, ENV) {
    return Restangular.withConfig(function(RestangularConfig) {
      RestangularConfig.setBaseUrl(ENV.baseURL);
    });
  });


  general.factory('SwitchSvc', function (GeneralRestangular) {
    var svc = {
      base: function (container) {
        container = container || 'default';
        return GeneralRestangular.one('controller/nb/v2').one('switchmanager', container);
      },
      data: null
    };

    svc.delete = function(node) {
    /* console.log(node);
      return svc.nodeUrl('default', node.node.type, node.node.id).remove();*/
    };

    // URL for nodes
    svc.nodesUrl = function (container) {
      return svc.base(container).all('nodes');
    };

    // URL for a node
    svc.nodeUrl = function (container, type, id) {
      return svc.base(container).one('node', type).one(id);
    };

    svc.getAll = function (container) {
      return svc.nodesUrl(container).getList();
    };

    svc.getConnectorProperties = function (container, type, id) {
      return svc.nodeUrl(container, type, id).get();
    };

    svc.itemData = function (i) {
      return {
        state: 'node.detail',
        name: i.properties.description.value !== 'None' ? i.properties.description.value : i.node.type + '/' + i.node.id,
        params: {nodeId: i.node.id, nodeType: i.node.type}
      };
    };

    svc.itemsData = function (data_) {
      var data = [];

      angular.forEach(data_.nodeProperties, function (value, key) {
        data.push(svc.itemData(value));
      });

      return data;
    };

    return svc;
  });
});

