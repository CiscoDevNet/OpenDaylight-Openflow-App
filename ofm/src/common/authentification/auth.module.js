/*
 * Copyright (c) 2014 Inocybe Technologies, and others.  All rights reserved.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v1.0 which accompanies this distribution,
 * and is available at http://www.eclipse.org/legal/epl-v10.html
 */

define(['angularAMD', 'common/config/env.module'], function(ng) {
  var auth = angular.module('app.common.auth', ['config', 'ngCookies']);
  auth.config(function($compileProvider, $controllerProvider, $provide, $httpProvider) {
    auth.register = {
      controller : $controllerProvider.register,
      directive : $compileProvider.directive,
      factory : $provide.factory,
      service : $provide.service

    };
    $httpProvider.interceptors.push('NbInterceptor');
  });
  return auth;
});
