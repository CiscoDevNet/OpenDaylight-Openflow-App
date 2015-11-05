angular.module('common.filters', [])

// Filter to return only valid ports (like id != 0)
.filter('noRootPorts', function () {
  return function (input) {
    if (!input) {
      return;
    }
    return input.filter(function(port) {
      return port.nodeconnector.id !== "0" ? port : null;
    });
  };
});
