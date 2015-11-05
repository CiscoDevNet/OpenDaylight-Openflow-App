/*
Anything that doesn't go into a seperate file (as in is deemed too big for here) goes here.

Examples: Auth logic
*/

angular.module('common.services', [])

.factory('NBApiStatSvc', ['$http', 'config', function ($http, config) {
  var svc = {};

  svc.check = function (cb) {
    $http.get(config.endpoint_base).success(
      function (resp) {
        cb();
      }
    );
  };

  return svc;
}])

.factory('UserService', function () {
  var user = null;
  var userRoles = [];

  var factory = {};

  return factory;
});