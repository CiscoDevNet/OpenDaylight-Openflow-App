/*
 * Copyright (c) 2014 Cisco Systems.  All rights reserved.
 *
 */

define(['common/authentification/auth.module'], function(auth) {

  auth.factory('Auth', function($http, $window, $rootScope, $cookies, Base64, ENV){
          var factory = {};
          // Set Authorization header to username + password
          factory.setBasic = function(user, pw) {
            $window.sessionStorage.odlUser = user;
            $window.sessionStorage.odlPass = pw;
            //also set is as a cookie
            $cookies.putObject(user,pw, {path:'/'});
          };

          factory.unsetBasic = function() {
              if ($http.defaults.headers.common.Authorization !== null) {
                delete $http.defaults.headers.common.Authorization;
              }
              delete $window.sessionStorage.odlUser;
              delete $window.sessionStorage.odlPass;
              // Remove the cookie
              $cookies.remove('token', {path:'/'});
          };

          // Return the current user object
          factory.getUser = function() {
              var user = $window.sessionStorage.odlUser || null;
              return user;
          };

          factory.authorize = function(accessLevel, role) {
              if(role === undefined) {
                  role = currentUser.role;
              }
              return accessLevel.bitMask & role.bitMask;
          };
          factory.isAuthed = function () {
              var authed = factory.getUser() ? true : false;
              return authed;
          };
          factory.isLoggedIn = function(user) {
              if(user === undefined) {
                  user = currentUser;
              }
              return user.role.title == userRoles.user.title || user.role.title == userRoles.admin.title;
          };
          /*factory.register = function(user, success, error) {
              $http.post('/register', user).success(function(res) {
                  changeUser(res);
                  success();
              }).error(error);
          };*/
          factory.login = function (user, pw, cb, eb) {
              //let's clear the stored token & creds before we proceed.
              factory.unsetBasic();
              $window.sessionStorage.username = user;
              $rootScope.username = user;
              $http({
                  method: 'POST',
                  url: ENV.getBaseURL("AUTH"),
                  data: "grant_type=password&username=" + user + "&password=" + pw + "&scope=sdn",
                  headers: {'Content-Type': 'application/x-www-form-urlencoded'}
              }).success(function (data, status, headers, config) {
                      //store token from data in storage
                    factory.setBasic("token", data.access_token);
                    factory.getRole(function(){cb(data);});
                  })
                  .error(function (resp, status) {
                    factory.unsetBasic();
                    eb(resp, status);
                  });
          };
          factory.logout = function() {
                  factory.unsetBasic();
          };
          factory.getRole = function(cbk) {
              $http.get(ENV.getBaseURL('AAA') + '/auth/v1/users/=' + $rootScope.username)
                  .success(function(data) {
                      if (data.roleName == "admin") {
                          console.log("A user with 'admin' priveleges logged in");
                          $rootScope.isLoggedInUserAdmin = true;
                          cbk();
                      } else {
                          console.log("A user with 'non-admin' priveleges logged in");
                          $rootScope.isLoggedInUserAdmin = false;
                          cbk();
                      }
                  })
                  .error(function () {
                      console.log("Error fetching user by name. Assuming 'user' role.");
                      $rootScope.isLoggedInUserAdmin = false;
                      cbk();
                  });
          };
          return factory;
  });

  auth.factory('Base64', function() {
    var keyStr = 'ABCDEFGHIJKLMNOP' +
      'QRSTUVWXYZabcdef' +
      'ghijklmnopqrstuv' +
      'wxyz0123456789+/' +
      '=';
    return {
      encode: function (input) {
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;

        do {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                keyStr.charAt(enc1) +
                keyStr.charAt(enc2) +
                keyStr.charAt(enc3) +
                keyStr.charAt(enc4);
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";
        } while (i < input.length);

        return output;
      },
      decode: function (input) {
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;

        // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
        var base64test = /[^A-Za-z0-9\+\/\=]/g;
        if (base64test.exec(input)) {
          alert("There were invalid base64 characters in the input text.\n" +
              "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
              "Expect errors in decoding.");
        }

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        do {
          enc1 = keyStr.indexOf(input.charAt(i++));
          enc2 = keyStr.indexOf(input.charAt(i++));
          enc3 = keyStr.indexOf(input.charAt(i++));
          enc4 = keyStr.indexOf(input.charAt(i++));

          chr1 = (enc1 << 2) | (enc2 >> 4);
          chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          chr3 = ((enc3 & 3) << 6) | enc4;

          output = output + String.fromCharCode(chr1);

          if (enc3 != 64) {
              output = output + String.fromCharCode(chr2);
          }
          if (enc4 != 64) {
              output = output + String.fromCharCode(chr3);
          }

          chr1 = chr2 = chr3 = "";
          enc1 = enc2 = enc3 = enc4 = "";

        } while (i < input.length);

        return output;
      }
    };
  });

  // Filter to add authorization header if its a nb api call
  auth.factory('NbInterceptor', function($q, $window, Base64, $location, $rootScope) {
    return {
      request : function(config) {
          // Use AAA basic authentication
        //if (config.url.indexOf('restconf') != -1 || config.url.indexOf('controller/nb/v2') != -1) {
          config.headers = config.headers || {};
          if ($window.sessionStorage.odlUser && $window.sessionStorage.odlPass) {
            var encoded = Base64.encode($window.sessionStorage.odlUser + ':' + $window.sessionStorage.odlPass);
            config.headers.Authorization = 'Basic ' + encoded;
          }
        //}
        return config;
      },
      response : 
      function(response) {
        return response || $q.when(response);
      },
      responseError : function(response) {
                
        if (response.status === 401) {
          console.log("Intercepter: Error code: " + response.status + ", For URL: " + response.config.url);
          if (!$location.path().startsWith("/setup")) {
            $rootScope.$broadcast('invalidTokenEvent');
          }
        }
        return $q.reject(response);
      }
    };
  });
  
});
