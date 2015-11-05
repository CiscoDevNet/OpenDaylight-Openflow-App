define(['common/general/common.general.module'], function(general) {

  // Filter to return only valid ports (like id != 0)
  general.register.filter('noRootPorts', function () {
    return function (input) {
      if (!input) {
        return;
      }
      return input.filter(function(port) {
        return port.nodeconnector.id !== "0" ? port : null;
      });
    };
  });

});
