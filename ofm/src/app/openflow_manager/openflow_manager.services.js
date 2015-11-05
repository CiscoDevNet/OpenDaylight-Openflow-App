define(['app/openflow_manager/openflow_manager.module'], function(openFlowManager) {

  openFlowManager.register.factory('OpenFlowManagerConfigRestangular', function(Restangular, ENV) {
    return Restangular.withConfig(function(RestangularConfig) {
      RestangularConfig.setBaseUrl(ENV.getBaseURL("CONTROLLER"));
    });
  });

  openFlowManager.register.factory('CommonFlowOpers',  ['FlowProperties', function(FlowProperties) {
      var cfo = {},
          pvd = {};

      var in_port = function(selDevice) {
          var terminationPoints = selDevice['termination-point'] || [],
              ports = terminationPoints.map(function(tp){
                          return tp['tp-id'];
                      });

          return ports;
      };

      var out_port = function(selDevice) {
          var terminationPoints = selDevice['termination-point'] || [],
              selDevIdLength = selDevice['node-id'].toString().length;
              ports = terminationPoints.map(function(tp){
                          return tp['tp-id'].slice(selDevIdLength+1);
                      });

          return ports;
      };

      pvd['in-port'] = in_port;
      pvd['output-node-connector'] = out_port;

      getPermValuesData = function(propName, selDevice) {
          var valuesData = [];
          if(angular.isFunction(pvd[propName])) {
              valuesData = pvd[propName](selDevice);
          }
          return valuesData;
      };

      cfo.addPropToList  = function(propLabel, propsListFrom, propsListTo) {
          var prop = propsListFrom.filter(function(flow){
              return flow.displayLabel === propLabel;
          });

          if (prop.length) {
              cfo.addFlowProperty(prop[0], propsListTo);
          }

          cfo.setPermValues();
      };

      cfo.isMandatory = function(prop) {
          return prop.isType(FlowProperties.types.mandatory);
      };

      cfo.addMandatoryProperties = function(propList, listAdd) {
          propList.forEach(function(fp) {
              if(cfo.isMandatory(fp)) {
                  cfo.addFlowProperty(fp, listAdd);
              }
          });
      };

      cfo.clearPropertiesGroup = function(propObj) {
          for(var key in propObj) {
              propObj[key].clear();
          }
      };

      cfo.addProperties = function(req, propList, listAdd) {
          propList.forEach(function(fp) {
              var reqData = fp.getReqData(req);
              if(reqData || reqData === 0) {
                  cfo.addFlowProperty(fp, listAdd);
              }
          });
      };

      cfo.addFlowProperty = function(prop, propList) {
          if(prop && propList.indexOf(prop) === -1) {
              propList.push(prop);
          }
      };

      cfo.removeFlowProperty = function(prop, propList) {
          propList.splice(propList.indexOf(prop), 1);
      };

      cfo.setPermValues = function(selDevice, propWithPermVal){
          if(propWithPermVal && selDevice) {
              propWithPermVal.forEach(function(permProp){
                  var valuesData = getPermValuesData(permProp.label, selDevice);
                  permProp.permValues = valuesData;
              });
          }
      };

      return cfo;
  }]);

  openFlowManager.register.factory('FlowObjChecker', [function() {

      foc = {};

      foc.createCheckCbk = function(testCbk, handlerCbk) {
          return function(scope, flowObj) {
              var test = testCbk(scope, flowObj);

              if(test) {
                  handlerCbk(scope);
              }

              return test;
          };
      };

      foc.Checker = function() {
          this.checkCbks = [];

          this.addCheck = function(checkCbk, index) {
              this.checkCbks.splice(index, 0, checkCbk);
          };

          this.appendCheck = function(checkCbk) {
              this.checkCbks.push(checkCbk);
          };

          this.removeCheck = function(index) {
              this.checkCbk.splice(index, 1);
          };

          this.executeChecks = function(scope, flowObj) {
              this.checkCbks.some(function(check, i) {
                  return check(scope, flowObj);
              });
          };
      };

      return foc;
  }]);

  openFlowManager.register.factory('odlDeviceTypeHandler', ['FlowObjChecker', 'OpenFlowManagerUtils', function(FlowObjChecker, OpenFlowManagerUtils) {

      h = {};

      var handle = function(scope) {
          scope.ctrl = 'odlDeviceVersion';
      };

      var test = function(scope, flowObj) {
          var version = scope.selDevice ? scope.selDevice.version : OpenFlowManagerUtils.ofVersionEnum.NONE;
          return version !== OpenFlowManagerUtils.ofVersionEnum.NONE;
      };

      h.registerCallback = function(checker) {
          var checkObj = FlowObjChecker.createCheckCbk(test, handle);
          checker.appendCheck(checkObj);
      };

      return h;
  }]);

  openFlowManager.register.factory('ofTypeHandler', ['FlowObjChecker', function(FlowObjChecker) {

      h = {};

      var handle = function(scope) {
          scope.ctrl = 'ofType';
      };

      var test = function(scope, flowObj) {
          return true;
      };

      h.registerCallback = function(checker) {
          var checkObj = FlowObjChecker.createCheckCbk(test, handle);
          checker.appendCheck(checkObj);
      };

      return h;
  }]);

  openFlowManager.register.factory('pipelineHandler', ['FlowObjChecker', 'OpenFlowManagerUtils', function(FlowObjChecker, OpenFlowManagerUtils) {

      h = {};

      h.deviceConfigurations = [];

      OpenFlowManagerUtils.loadDevicesConfig(function(configs) {
          h.deviceConfigurations = configs;
      }, function() {
          h.deviceConfigurations = [];
      });

      var deviceHasConfig = function(deviceType) {
          return h.deviceConfigurations.some(function(cfg) {
              return cfg.device_type.indexOf(deviceType) !== -1;
          });
      };

      h.getDeviceConfig = function(deviceType) {
          return h.deviceConfigurations.filter(function(cfg) {
              return cfg.device_type.indexOf(deviceType) !== -1;
          })[0];
      };

      h.getPipelineNumber = function(device) {
          var number = null,
              separator = ':',
              prop = device['id'];

          if(prop.indexOf(separator) !== -1) {
              number = parseInt(parseInt(prop.slice(prop.indexOf(separator) + 1)).toString(16)[0], 10);
          }
          return number;
      };

      h.getPipelineConfigFile = function(device_code, pid, tid) {
          return 'pipelines/did_'+device_code+'_pid_'+pid+'_tid_'+tid;
      };

      var handle = function(scope) {
          scope.ctrl = 'pipeline';
      };

      var hasPipeline = function(device){
        return h.getPipelineNumber(device) ? true : false;
      };

      var test = function(scope, flowObj) {
          return scope.selDevice && deviceHasConfig(scope.getDeviceType(scope.selDevice)) && hasPipeline(scope.selDevice);
      };

      h.registerCallback = function(checker) {
          var checkObj = FlowObjChecker.createCheckCbk(test, handle);
          checker.appendCheck(checkObj);
      };

      return h;
  }]);

  openFlowManager.register.factory('FlowProcessor', function() {

      var fp = {};

      var Flow = function(data, device_id, mod, operational, ofType) {
          this.data = data;
          this.device = device_id;
          this.mod = mod;
          this.ofType = ofType;
          this.operational = operational;
          this.error = [];
          this.duplicity = false;

          this.setOperational = function(value) {
              this.operational = value;
          };

          this.addErrorMsg = function(msg) {
              if(this.error.indexOf(msg) === -1) {
                  this.error.push(msg);
              }
          };
      };

      fp.createEmptyFlow = function() {
          return new Flow({}, null, 0, 0, null);
      };

      fp.network = function(nodes, filterCbk) {
          var network_flows = [];

          filterCbk = filterCbk || function() { return true; };

          nodes.forEach(function(node) {
              var tables = node['flow-node-inventory:table'] || [],
                  device_id = node.id;

              tables.forEach(function(table) {
                  var flows = table['flow'] || [];
                  network_flows = network_flows.concat(
                      flows.filter(function(flow) {
                          return filterCbk(device_id, flow);
                      })
                      .map(function(flow) {
                          return new Flow(flow, device_id, 1, 1);
                      })
                  );
              });
          });

          return network_flows;
      };

      fp.networkOperational = function(nodes, deviceFilterCbk, isInOperationalCbk) {
          var network_flows = [];

          isInOperationalCbk = isInOperationalCbk || function() { return false; };
          deviceFilterCbk = deviceFilterCbk || function() { return true; };

          nodes
            .filter(function(node) {
              return deviceFilterCbk(node.id);
            })
            .forEach(function(node) {
              var tables = node['flow-node-inventory:table'] || [],
                  device_id = node.id;

              tables.forEach(function(table) {
                  var flows = table['flow'] || [];
                  
                  network_flows = network_flows.concat(
                      flows.map(function(flow) {
                          var configFlow = isInOperationalCbk(device_id, flow);
                          if(configFlow) {
                              configFlow.setOperational(3);
                              return configFlow;
                          } else {
                              return new Flow(flow, device_id, 1, 2);
                          }
                      })
                  );
              });
          });

          return network_flows;
      };

      fp.__test = {
        Flow : Flow
      };

      return fp;
  });

  openFlowManager.register.factory('StatisticsProcessor', function() {

      var sp = {},
          getCorrectPropName = function(prop){
            var capitaliseFirstLetter = function(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            },
            stringArray = [];


            stringArray = prop.split('-');
            prop = '';
            stringArray.forEach(function(p){
              prop += capitaliseFirstLetter(p);
            });
            return prop;
          },
          capitaliseFirstLetter = function(string) {
              return string.charAt(0).toUpperCase() + string.slice(1);
          },
          getPropToSameLvl = function(objSource, name, obj, returnObj){
            var functCallBack = function(i, index){
                  getPropToSameLvl(i, (!returnObj ? '' : name + '-')  + capitaliseFirstLetter(prop) + '_' + index + '_', obj, true);
                };

            for ( var prop in objSource ){
              if ( typeof objSource[prop] === 'object' && Object.keys(objSource[prop]).length && !(objSource[prop] instanceof Array) ) {
                getPropToSameLvl(objSource[prop], (!returnObj ? '' : name + '-')  + capitaliseFirstLetter(prop), obj, true);
              } else {

                if ( objSource[prop] instanceof Array ) {

                  if ( typeof objSource[prop][0] === 'object' ){
                    objSource[prop].forEach(functCallBack);
                  }else {
                    arrayString = objSource[prop].join(', ');
                    obj[ (!returnObj ? '' : name + '-')  + capitaliseFirstLetter(prop) ] = {value: arrayString};
                  }

                } else {
                  obj[ (!returnObj ? '' : name + '-')  + capitaliseFirstLetter(prop)] = {value: objSource[prop]};
                }

              }
            }

            if ( !returnObj ) {
              return obj;
            }
          },
          getAfsStats = function(objAfs){
            //agregate stats
            var destObjStats = {};
            destObjStats = getPropToSameLvl(objAfs, 'afs', destObjStats);

            return destObjStats;
          },
          getFtsStats = function(objFts){
            //table flow stats
            var destObjStats = {};
            destObjStats = getPropToSameLvl(objFts, 'fts', destObjStats);

            return destObjStats;
          },
          getFsStats = function(arrayFs){
            //flow statistics

            var destArrayStats = [];
            arrayFs.forEach(function(flow){

               var flowStat = sp.getFlowStats(flow);

               if ( flowStat ) {
                destArrayStats.push(flowStat);
               }
            });

            return destArrayStats;
          },
          setPosToStatsObj = function(obj){
            var counter = 0;
            for (var prop in obj ){
              obj[prop].pos = counter;
              counter++;
            }
          },
          changeStatsObjPosition = function(obj, prop, pos){
            var findObj = function(o, p, cbk){
                            for( var prop in o ){
                              if (o[prop].pos === p){
                                cbk(o[prop]);
                              }
                            }
                          };

            if ( obj[prop] ) {
              findObj(obj, pos, function(foundedObj){
                foundedObj.pos = obj[prop].pos;
                obj[prop].pos = pos;
              });
            }


          },
          sortObjByPos = function(obj){
            var sortedObj = {},
              toSortArray = [];

            for ( var prop in obj ){
              var newObj = {};
              newObj = obj[prop];
              newObj.name = prop;
              toSortArray.push(newObj);
            }

            toSortArray.sort(function(a, b){
              return a.pos - b.pos;
            });

            toSortArray.forEach(function(i){
              sortedObj[i.name] = i;
              delete sortedObj[i.name].name;
            });

            return sortedObj;
          };

      sp.generalStatsByConnector = function(connector, device, deviceName, property, name){

        var nc_stats = connector[property] || [],
            destObjStats = {},
            obj = {};

        destObjStats.Device = {value: device};

        destObjStats.DeviceType = {value: device};
        destObjStats.DeviceName = {value: deviceName};
        destObjStats.Id = {value: connector.id};

        obj = getPropToSameLvl(nc_stats, name, obj);
        for (var prop in obj){
          destObjStats[prop.replace(/-/g,'')] = obj[prop];
        }

        return destObjStats;

      };

      sp.portStatsByNode = function(node, stats){
        var node_connectors = node['node-connector'] || [],
            deviceId = node.id,
            deviceName = node['flow-node-inventory:description'],
            devObj = {};



          devObj['stats-array'] = [];
          devObj.device = deviceId;

          node_connectors.forEach(function(nc) {
              var objStats = sp.generalStatsByConnector(nc, deviceId, deviceName, stats.container, stats.type.toLowerCase());

              devObj['stats-array'].push(objStats);
          });

        return node_connectors.length ? devObj : null;
      };

      sp.queueStatsByNode = function(node, stats){
        var node_connectors = node['node-connector'] || [],
            deviceId = node.id,
            deviceName = node['flow-node-inventory:description'],
            devObj = {};



          devObj['stats-array'] = [];
          devObj.device = deviceId;

          node_connectors.forEach(function(nc) {
              var queueObj = nc['flow-node-inventory:queue'];

              if ( queueObj ) {


                queueObj.forEach(function(q){
                  q.id = nc.id;
                  var objStats = sp.generalStatsByConnector(q, deviceId, deviceName, stats.container, stats.type.toLowerCase());
                  objStats['Connector'] = objStats.Id;
                  delete objStats.Id;
                  objStats['QueueId'] = {
                                          value: q['queue-id']
                                        };

                  setPosToStatsObj(objStats);
                  changeStatsObjPosition(objStats, 'QueueId', 2);
                  changeStatsObjPosition(objStats, 'Connector', 3);
                  objStats = sortObjByPos(objStats);

                  devObj['stats-array'].push(objStats);
                });

              }

          });

          return node_connectors.length ? devObj : null;
      };

      sp.generalStatsByNodes = function(nodes, obj) {
          var portStats = [];

          nodes.forEach(function(node) {
            var nodeStats = sp[obj.serviceFunct](node, obj);

            if ( nodeStats ){
              portStats.push(nodeStats);
            }

          });

          return portStats;
      };

      sp.generalStatsByProp = function(statsObj, device, deviceName, property, name){

        var nc_stats = statsObj[property] || [],
            destObjStats = {},
            obj = {};

        destObjStats.Device = {value: device};
        destObjStats.DeviceType = {value: device};
        destObjStats.DeviceName = {value: deviceName};

        obj = getPropToSameLvl(nc_stats, name, obj);
        for (var prop in obj){
          destObjStats[getCorrectPropName(prop)] = obj[prop];//prop.replace(/-/g,'')
        }

        return Object.keys(obj).length !== 0 ? destObjStats : null;

      };

      sp.gmStatsByNode = function(node, stats){
        var nodeContainer = node[stats.parentContainer] || [],
            deviceId = node.id,
            deviceName = node['flow-node-inventory:description'],
            devObj = {};


          devObj['stats-array'] = [];
          devObj.device = deviceId;

          nodeContainer.forEach(function(nc) {
              var objStats = sp.generalStatsByProp(nc, deviceId, deviceName, stats.container, stats.type.toLowerCase());

              setPosToStatsObj(objStats);
              changeStatsObjPosition(objStats, 'GroupId', 2);
              changeStatsObjPosition(objStats, 'MeterId', 2);
              objStats = sortObjByPos(objStats);

              devObj['stats-array'].push(objStats);
          });

        return nodeContainer.length ? devObj : null;
      };

      sp.getGMStats = function(nodes, obj){
        var gmStats = [];

          nodes.forEach(function(node) {
            var nodeStats = sp.gmStatsByNode(node, obj);

            if ( nodeStats ){
              gmStats.push(nodeStats);
            }

          });

          return gmStats;
      };

      sp.generalStatsByNode = function(node, propName, name){
        var deviceId = node.id,
            deviceName = node['flow-node-inventory:description'],
            devObj = {};

        devObj['stats-array'] = [];
        devObj.device = deviceId;

        var objStats = sp.generalStatsByProp(node, deviceId, deviceName, propName, name);
        devObj['stats-array'].push(objStats);

        return objStats ? devObj : null;
      };

      sp.getMeterFeaturesStats = function(nodes, stats){
        var meterStats = [];

          nodes.forEach(function(node) {
                var meterStatsObj = sp.generalStatsByNode(node, stats.container, stats.type.toLowerCase());

                if ( meterStatsObj ) {
                  meterStats.push(meterStatsObj);
                }
          });

          return meterStats;
      };

      sp.getFlowStats = function(flow){
        var objFs = flow['opendaylight-flow-statistics:flow-statistics'] || {},
            obj = {},
            id = flow.id;

        if ( Object.keys(objFs).length ) {
          obj['flow-id'] = {value: id};
          obj = getPropToSameLvl(objFs, 'fs', obj);
          return obj;
        } else {
          return null;
        }

      };

      sp.tableStatsByNode = function(node){
        var tables = node['flow-node-inventory:table'] || [],
            deviceId = node.id,
            deviceName = node['flow-node-inventory:description'],
            devObj = {};

        devObj['table-statistics'] = [];
        devObj.device = deviceId;
        //devObj.DeviceType = deviceId;

        tables.forEach(function(table){
          var objTable = {},
              objAfs = table['opendaylight-flow-statistics:aggregate-flow-statistics'] || {},
              objFts = table['opendaylight-flow-table-statistics:flow-table-statistics'] || {},
              arrayFs = table.flow || [];


          objTable.afs = getAfsStats(objAfs);
          objTable.fts = getFtsStats(objFts);
          objTable.fs = getFsStats(arrayFs);
          objTable.id = {value: table.id};
          objTable.device = {value: deviceId};
          objTable.DeviceType = {value: deviceId};
          objTable.DeviceName = {value: deviceName};

          devObj['table-statistics'].push(objTable);

        });

        return tables.length ? devObj : null;
      };

      sp.tableStatsByNodes = function(nodes){

        var tableStats = [];

        nodes.forEach(function(node){
          var nodeStats = sp.tableStatsByNode(node);

          if ( nodeStats ){
            tableStats.push(nodeStats);
          }
        });

        return tableStats;
      };

      sp.getAggregateFstats = function(tableStats){
        return tableStats.map(function(item){
            var statsArray = item['table-statistics'].map(function(table){
              var obj = {};
              obj['Device'] = table.device;
              obj['DeviceType'] = table.DeviceType;
              obj['DeviceName'] = table.DeviceName;
              obj['TableId'] = table.id;
              for (var prop in table.afs){
                obj[prop.replace(/-/g,'')] = table.afs[prop];
              }
              return obj;
            });
            return {
              device: item.device,
              'stats-array': statsArray
            };
        });
      };

      sp.getFlowTstats = function(tableStats){
        return tableStats.map(function(item){
            var statsArray = item['table-statistics'].map(function(table){
              var obj = {};

              obj['Device'] = table.device;
              obj['DeviceType'] = table.DeviceType;
              obj['DeviceName'] = table.DeviceName;
              obj['TableId'] = table.id;
              for (var prop in table.fts){
                obj[prop.replace(/-/g,'')] = table.fts[prop];
              }
              return obj;
            });
            return {
              device: item.device,
              'stats-array': statsArray
            };
        });
      };

      sp.getFlowSstats = function(tableStats){
        var FTS = tableStats.map(function(item){
            var flowStatsArray = [],
                filteredArray = item['table-statistics'].filter(function(table){
                  return table.fs.length ? true : false;
                }),
                device = item.device;

            var statsArray = filteredArray.map(function(table){
                  return {
                          id: table.id,
                          DeviceType: table.DeviceType,
                          DeviceName: table.DeviceName,
                          stats: table.fs
                        };
                });

            statsArray.forEach(function(table){
                table.stats.forEach(function(flow){
                  var obj = {};

                  obj['Device'] = {value: device};
                  obj['DeviceType'] = {value: device};//table.DeviceType;
                  obj['DeviceName'] = {value: table.DeviceName.value};
                  obj['TableId'] = table.id;
                  for (var prop in flow){
                    obj[prop.replace(/-/g,'')] = flow[prop];
                  }
                  flowStatsArray.push(obj);
                });
            });

            return {
              device: item.device,
              'stats-array': flowStatsArray
            };

        });

        return FTS;

      };

      sp.updateDataValue = function(data){
        data.forEach(function(device){
          device['stats-array'].forEach(function(connector){
            for( var prop in connector ){
              connector[prop] = connector[prop].value;
            }
          });
        });

        return data;
      };

      return sp;
  });

  openFlowManager.register.factory('HostsHandlerService', ['$http', function($http){
    var hhs = {};

    hhs.getHostsData = function(topoData){

      if ( topoData.length ) {
        return topoData.map(function(h){
          return {
            id: h['node-id'],
            'attachment-points-id': h['host-tracker-service:attachment-points'][0]['tp-id'],
            'attachment-points-active': h['host-tracker-service:attachment-points'][0]['active'],
            'addresses-ip': h['host-tracker-service:addresses'][0]['ip'],
            'addresses-mac': h['host-tracker-service:addresses'][0]['mac'],
            'addresses-last-seen': h['host-tracker-service:addresses'][0]['last-seen']
          };
        });
      } else {
        return [];
      }


    };

    return hhs;
  }]);

  openFlowManager.register.factory('PropertiesBuilder',['restrictionsFact' , 'FlowProperties', 'typeWrapper', '$http', function(restrictionsFact, FlowProperties, typeWrapper, $http) {

      var pb = {};

      var getFullName = function(xml) {
          var module = $(xml).attr('module') ? ($(xml).attr('module') + ':') : '';
          return module + xml.tagName.toLowerCase();
      };

      var createProp = function(xml, reqParents, parent) {
          var getPropTypeArray = function(xmlType){
                var typeArray = [];
                xmlType.each(function(_, child){
                  typeArray.push(child.tagName);
                });
                return typeArray;
              },
              displayLabel = $(xml).children('displayLabel:first').text(),//getBuildCallback
              label = getFullName(xml),
              dataType = $(xml).children('dataType:first').text(),
              type = $(xml).children('type:first') ? getPropTypeArray($(xml).children('type:first').children()) : null,
              tooltip = $(xml).children('tooltip:first').text(),
              placeholder = $(xml).children('placeholder:first').text(),
              grouping = $(xml).children('grouping:first').text().length ? $(xml).children('grouping:first').text().split('-') : null,
              checkCbk = $(xml).children('checkCbk:first').text().length ? FlowProperties.getCheckCallback($(xml).children('checkCbk:first').text()) : null,
              getReqDataCbk = null,
              permValues = $(xml).children('permValues:first').text().length ? $(xml).children('permValues:first').text().split('-') : null,
              changeValCbk = $(xml).children('changeValCbk:first').text().length ? FlowProperties.getChangeValCallback($(xml).children('changeValCbk:first').text()) : null;

          var property = new FlowProperties.FlowValueProp(displayLabel, label, parent, reqParents, dataType, grouping, getReqDataCbk, type, tooltip, checkCbk, placeholder, permValues, changeValCbk);

          var displayOverrideCbk = $(xml).children('displayOverride:first').text().length ? FlowProperties.getDisplayOverrideCallback($(xml).children('displayOverride:first').text(), property) : null;
          if(displayOverrideCbk) {
              property.displayOverrideCbk = displayOverrideCbk;
          }

          var buildReq = $(xml).children('buildReq:first').text().length ? FlowProperties.getBuildCallback($(xml).children('buildReq:first').text(), property) : null;
          if ( angular.isFunction(buildReq) ) {
            property.build = buildReq;
          }

          getReqDataCbk = $(xml).children('getReqData:first').text().length ? FlowProperties.getReqDataCallback($(xml).children('getReqData:first').text(), property) : property.getReqData;
          property.getReqData = getReqDataCbk;
      };


      var createContainer = function(xml, reqParents, parent) {
          var propXml = $(xml).children('ofm-cont-properties:first').get(0),
              displayLabel = $(propXml).children('displayLabel:first').text(),
              label = getFullName(xml),
              grouping = $(propXml).children('grouping:first').text().length ? $(propXml).children('grouping:first').text().split('-') : null,
              getReqData = null;

          var new_container = new FlowProperties.FlowContainerProp(displayLabel, label, parent, reqParents, null, getReqData, grouping);

          var buildReq = $(propXml).children('buildReq:first').text().length ? FlowProperties.getBuildCallback($(propXml).children('buildReq:first').text(), new_container) : null;
          if(angular.isFunction(buildReq)) {
              new_container.build = buildReq;
          }

          if($(propXml).children('getReqData:first').text().length) {
              var request = FlowProperties.getReqDataCallback($(propXml).children('getReqData:first').text(), new_container);

              if(request) {
                  new_container.getReqData = request;
              }
          }

          return new_container;
      };

      var getElementType = function(xml) {
          return $(xml).attr('type') || 'element';
      };

      var parse_functions = {};

      parse_functions.element = function(xml, parents, container) {
          var name = xml.tagName.toLowerCase();
          parseXML(xml, parents.concat([name]), container);
      };

      parse_functions.container = function(xml, parents, container) {
          new_container = createContainer(xml, parents, container);

          parseXML($(xml).children('children:first'), [], new_container);
      };

      parse_functions.property = function(xml, parents, container) {
          createProp(xml, parents, container);
      };

      var parseXML = function(xml, parents, container) {

          $(xml).children().each(function (_, item) {
              parse_functions[getElementType(item)](item, parents, container);
          });
      };

      var parsePropXML = function(type, successCbk, errorCbk){
          var path = './assets/ofm2xml/' + type + '.xml';

          $http.get(path).success(function(data) {
              var rootGeneralProps = new FlowProperties.FlowContainerProp(),
                  rootMatchProps =  new FlowProperties.FlowContainerProp(),
                  rootActionProps = new FlowProperties.FlowContainerProp();

              parseXML($($.parseXML(data)).find('general-properties:first'), [], rootGeneralProps);
              parseXML($($.parseXML(data)).find('match:first'), [], rootMatchProps);
              parseXML($($.parseXML(data)).find('actions:first'), [], rootActionProps);

              successCbk(rootGeneralProps.children, rootMatchProps.children, rootActionProps.children);
          }).error(function() {
              console.warn('cannot load file '+ path);
              errorCbk();
          });
      };

      pb.createProperties = parsePropXML;

      return pb;

  }]);

  openFlowManager.register.factory('SettingsUtilities',[function() {
      var su = {};

      //callback is a function with one argument represent value that has been set
      su.SettingsHandler = function(callback, values) {
          this.values = values || {};
          this.currentValue = null;
          this.ctrlValue = null;
          this.runCallback = callback || function() {
              console.warn('callback is not defined');
          };

          this.setCallback = function(cbk) {
            this.runCallback = cbk;
          };

          this.setCurrentValue = function(value) {
              this.defaultValue = value;
          };

          this.setCtrltValue = function(value) {
              this.ctrlValue = value;
          };

          this.setOtherValue = function(valueName, value) {
              this.values[valueName] = value;
          };

          this.hasChanged = function() {
              return this.currentValue !== null && (this.currentValue.toString() !== this.ctrlValue.toString());
          };
      };

      su.SettingPipeline = function() {
          this.settings = [];

          this.addSetting = function(settingHandlerObj) {
              if(this.settings.indexOf(settingHandlerObj) === -1) {
                  this.settings.push(settingHandlerObj);
              }
          };

          this.removeSetting = function(settingHandlerObj) {
               this.settings.splice(this.settings.indexOf(settingHandlerObj), 1);
          };

          this.run = function() {
              this.settings.forEach(function(settingHandler) {
                  if(settingHandler.hasChanged()) {
                      settingHandler.runCallback(settingHandler.currentValue);
                  }
              });
          };
      };

      return su;
  }]);

  openFlowManager.register.factory('FlowProperties',['$http' , 'restrictionsFact' , 'typeWrapper', function($http, restrictionsFact, typeWrapper) {

      var p = {},
          path = './assets',
          actionsPath = '/yang2xml/opendaylight-action-types.yang.xml',
          generalPath = '/yang2xml/opendaylight-flow-types.yang.xml';

      p.of10 = 1;
      p.of13 = 2;

      var getNestedReqObj = function(propList, reqObj) {
          var act = reqObj;

          propList.forEach(function(p) {
              if(act.hasOwnProperty(p) === false) {
                  act[p] = {};
              }
              act = act[p];
          });

          return act;
      };

      var initParent = function(propObj, parent) {
        if(parent && parent.hasOwnProperty('children')) {
            parent.children.push(propObj);
        }
      };

      var createGetReqDataCallback = function (prop) {
          return function(data) {
              var act = data,
                  valid = true,
                  label = prop.label,
                  parents = prop.reqParents;

              if(parents && parents.length) {
                  parents.forEach(function(p) {
                      if(act[p] !== undefined) {
                          act = act[p];
                      } else {
                          valid = false;
                      }

                      return valid;
                  });
              }

              if(valid) {
                  if(act[label] !== undefined) {
                      act = act[label];
                  } else {
                      valid = false;
                  }
              }

              if(valid) {
                  prop.setValue(act);
              }

              return valid ? act : null;
          };
      };

      var createGetReqDataFilterCallback = function (prop) {
          return function(data) {
              var act = data,
                  valid = true,
                  label = prop.label,
                  parents = prop.reqParents;

              if(parents && parents.length) {
                  parents.forEach(function(p) {
                      if(act[p] !== undefined) {
                          act = act[p];
                      } else {
                          valid = false;
                      }

                      return valid;
                  });
              }

              if(valid) {
                  if(act[label] !== undefined) {
                      act = act[label];
                  } else {
                      valid = false;
                  }
              }

              if(valid) {
                  prop.setValue(act.value);
                  prop.setFilterType(act.filterType);
                  prop.setFilterSelectboxBitsValue(act.filterSelectboxBitsValue);
              }

              return valid ? act.value : null;
          };
      };

      var dummyCheck = function() {
          return null;
      };

      var ErrorObj = function(prop, msg) {
          this.prop = prop;
          this.msg = msg;
      };

      var getDontHaveImplFunctionWarnMessage = function(prop, fnc_name) {
          return function() {
              console.warn(this,'doesn\'t have implemented '+fnc+' function');
          };
      };

      var BaseProp = function(displayLabel, label, parent, reqParents, grouping) {
          this.displayLabel = displayLabel;
          this.label = label;
          this.parent = parent;
          this.reqParents = reqParents || [];
          this.grouping = grouping || [];
          this.error = null;
          this.userData = {};

          this.getReqData = getDontHaveImplFunctionWarnMessage(this, 'getReqData');
          this.clear = getDontHaveImplFunctionWarnMessage(this, 'clear');
          this.build = getDontHaveImplFunctionWarnMessage(this, 'build');
          this.isType = getDontHaveImplFunctionWarnMessage(this, 'isType');
          this.check = getDontHaveImplFunctionWarnMessage(this, 'check');
      };

      var emptyFunc = function(){};

      var FlowValueProp = function(displayLabel, label, parent, reqParents, dataType, grouping, getReqDataCbk, type, tooltip, checkCbk, placeholder, permValues, changeValCbk, displayOverrideCbk) {
          BaseProp.call(this, displayLabel, label, parent, reqParents, grouping);
          this.value = null;
          this.dataType = dataType;
          this.type = type || [];
          this.getReqData = getReqDataCbk || createGetReqDataCallback(this);
          this.tooltip = tooltip ? tooltip : '';
          this.placeholder = placeholder || '';
          this.permValues = permValues || [];
          this.disabled = false;
          this.changeValCbk = changeValCbk ? changeValCbk : emptyFunc;
          this.displayOverrideCbk = displayOverrideCbk || function(data) { return data;};

          initParent(this, parent);

          this.disable = function() {
              this.disabled = true;
          };

          this.enable = function() {
              this.disabled = false;
          };

          this.setValue = function(value) {
              this.value = value;
              this.check();
          };

          this.clear = function() {
              this.value = null;
              this.error = null;
          };

          this.addErrorMsg = function(msg) {
              if(this.error.indexOf(msg) === -1) {
                  this.error.push(msg);
              }
          };

          this.check = function() {
              var cbk = checkCbk || dummyCheck;
                  result = null;

              if(this.value !== null && this.value !== '') {
                  result = cbk(this.value);
              }
              this.error = result;

              return (result !== null ? [new ErrorObj(this, result)] : null);
          };

          this.isType = function(type) {
              return this.type.indexOf(type) > -1;
          };

          this.build = function(req) {
              if(this.value !== null && this.value !== '') {
                  var nestedReqObj = getNestedReqObj(this.reqParents, req);
                  nestedReqObj[this.label] = this.value;
              }
          };

          this.compareGroup = function(compGroup, displayLabel){
              var lastSelChar = compGroup[compGroup.length - 1],
                  lastChar = this.grouping[this.grouping.length - 1],
                  stringSelProp = this.grouping.slice(0, this.grouping.length - 1).join(':'),
                  stringProp = compGroup.join(':');

              return displayLabel === this.displayLabel ? false : stringProp.indexOf(stringSelProp) !== 0 || !this.grouping.length ? true : lastChar === lastSelChar;
          };
      };
      FlowValueProp.prototype = Object.create(BaseProp.prototype);

      var FlowContainerProp = function(displayLabel, label, parent, reqParents, buildReq, getReqData, grouping) {
          BaseProp.call(this, displayLabel, label, parent, reqParents, grouping);
          this.children = [];

          initParent(this, parent);

          this.check = function() {
              var result = null;

              var errors =  this.children.map(function(ch) {
                  var res = ch.check();
                  return res !== null ? res[0] : null;
              }).filter(function(e) {
                  return e !== null;
              });
              result = errors.length ? errors : null;

              this.error = errors;

              return result;
          };

          this.clear = function() {
              this.userData = {};
              this.children.forEach(function(ch) {
                  ch.clear();
              });
          };

          this.isType = function() {
              return false;
          };

          this.build = buildReq || function(req) {
              var containerReq = null;

              if(this.children.length) {
                  var buildedReq = {};

                  this.children.forEach(function(ch) {
                      ch.build(buildedReq);
                  });

                  if($.isEmptyObject(buildedReq) === false) {
                      containerReq = buildedReq;
                  }
              } else {
                  containerReq = {};
              }

              if(containerReq) {
                  var nestedReqObj = getNestedReqObj(this.reqParents, req);
                  nestedReqObj[this.label] = containerReq;
              }
          };

          this.getReqData = getReqData || function(data) {
              var valid = false,
                  subData = data[this.label];

              if(subData) {
                  this.children.forEach(function(ch) {
                      var ch_valid = ch.getReqData(subData);
                      valid = valid || ch_valid;
                  });
              }

              return valid;
          };

          this.compareGroup = function(compGroup, displayLabel){
              var lastSelChar = compGroup[compGroup.length - 1],
                  lastChar = this.grouping[this.grouping.length - 1],
                  stringSelProp = this.grouping.slice(0, this.grouping.length - 1).join(':'),
                  stringProp = compGroup.join(':');

              return displayLabel === this.displayLabel ? false : stringProp.indexOf(stringSelProp) !== 0 || !this.grouping.length ? true : lastChar === lastSelChar;
          };
      };
      FlowContainerProp.prototype = Object.create(BaseProp.prototype);

      propetiesFactory = {};

      var of10 = [p.of10];
      var of13 = [p.of13];
      var both = [p.of10, p.of13];

      var mandatory = 'MANDATORY';
      var mod_fixed = 'MOD_FIXED';

      var getRestrictions = function(type) {
          var node = { builtInChecks: [] };

          if(typeWrapper.hasOwnProperty(type)) {
              typeWrapper[type](node);
          }

          return node.builtInChecks;
      };

      var createCheckCbk = function(restrictionObjsOr, restrictionObjsAnd, msg) {
          return function(value) {
              valid = true;

              if(restrictionObjsOr.length) {
                  valid = valid && restrictionObjsOr.some(function(r) {
                      return r.check(value);
                  });
              }

              if(restrictionObjsAnd.length) {
                  valid = valid && restrictionObjsAnd.every(function(r) {
                      return r.check(value);
                  });
              }

              return valid ? null : msg;
          };
      };

      var placeholders = {},
          checksCbks = {},
          buildCbks = {},
          reqDataCbks = {},
          changeValCbks = {},
          displayOverrideCbks = {};

      var numberCheck = restrictionsFact.getIsNumberFnc(),
          uint8Check = getRestrictions('uint8')[1],
          uint16Check = getRestrictions('uint16')[1],
          uint32Check = getRestrictions('uint32')[1],
          uint64Check = getRestrictions('uint64')[1],
          int32Check = getRestrictions('int32')[1],
          vlanIDCheck = restrictionsFact.getMinMaxFnc(0, 4095),
          vlanPCPCheck = restrictionsFact.getMinMaxFnc(0, 7),
          TOSCheck = restrictionsFact.getMinMaxFnc(0, 63),
          TOS2bitsCheck = restrictionsFact.getMinMaxFnc(0,3),
          portCheck = restrictionsFact.getMinMaxFnc(0, 65535),
          macCheck = restrictionsFact.getReqexpValidationFnc('^([0-9a-fA-F]{2}(:[0-9a-fA-F]{2}){5})$'),
          ipv4Check = restrictionsFact.getReqexpValidationFnc('^((([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])/(([0-9])|([1-2][0-9])|(3[0-2])))$'),
          ipv6ACheck = restrictionsFact.getReqexpValidationFnc('((:|[0-9a-fA-F]{0,4}):)([0-9a-fA-F]{0,4}:){0,5}((([0-9a-fA-F]{0,4}:)?(:|[0-9a-fA-F]{0,4}))|(((25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9])\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9])))(/(([0-9])|([0-9]{2})|(1[0-1][0-9])|(12[0-8])))'),
          ipv6BCheck = restrictionsFact.getReqexpValidationFnc('(([^:]+:){6}(([^:]+:[^:]+)|(.*\\..*)))|((([^:]+:)*[^:]+)?::(([^:]+:)*[^:]+)?)(/.+)');

      checksCbks.uint8CheckCallback = createCheckCbk([], [numberCheck, uint8Check], uint8Check.info);
      checksCbks.uint16CheckCallback = createCheckCbk([], [numberCheck, uint16Check], uint16Check.info);
      checksCbks.uint32CheckCallback = createCheckCbk([], [numberCheck, uint32Check], uint32Check.info);
      checksCbks.uint64CheckCallback = createCheckCbk([], [numberCheck, uint64Check], uint64Check.info);
      checksCbks.int32CheckCallback = createCheckCbk([], [numberCheck, int32Check], int32Check.info);
      checksCbks.vlanIDCheckCallback = createCheckCbk([], [numberCheck, vlanIDCheck], vlanIDCheck.info);
      checksCbks.vlanPCPCheckCallback = createCheckCbk([], [numberCheck, vlanPCPCheck], vlanPCPCheck.info);
      checksCbks.TOSCheckCallback = createCheckCbk([], [numberCheck, TOSCheck], TOSCheck.info);
      checksCbks.TOSCheck2bitsCallback = createCheckCbk([], [numberCheck, TOS2bitsCheck], TOS2bitsCheck.info);
      checksCbks.portCheckCallback = createCheckCbk([], [numberCheck, portCheck], portCheck.info);
      checksCbks.macCheckCallback = createCheckCbk([], [macCheck], 'Value must have 6 hexadecimal numbers in range 0-FF with colon delimeter');
      checksCbks.ipv4CheckCallback = createCheckCbk([], [ipv4Check], 'Value must be IPv4 valid address with netmask separated by slash');
      checksCbks.ipv6CheckCallback = createCheckCbk([ipv6ACheck, ipv6BCheck], [], 'Value must be IPv6 valid address');

      // BUILD REQUEST CALLBACKS
      buildCbks.cookieProp = function(prop){
        return function(req){
            if(prop.value !== null && prop.value !== '') {
                var nestedReqObj = getNestedReqObj(this.reqParents, req);
                nestedReqObj[this.label] = this.value;
                nestedReqObj['cookie_mask'] = '255';
            }
        };
      };

      buildCbks.vlanidProp = function(prop){
        return function(req) {
            if(prop.value !== null && prop.value !== '') {
                var nestedReqObj = getNestedReqObj(this.reqParents, req);
                nestedReqObj[this.label] = this.value;
                nestedReqObj['vlan-id-present'] = 'true';
            }
        };
      };

      buildCbks.controllerAction = function(prop){
        return function(req) {
            req['output-action'] = { 'output-node-connector': 'CONTROLLER'};
            prop.children[0].build(req['output-action']);
        };
      };

      buildCbks.normalAction = function(prop){
        return function(req) {
            req['output-action'] = { 'output-node-connector': 'NORMAL' };
            prop.children[0].build(req['output-action']);
        };
      };

      buildCbks.loopbackAction = function(prop){
        return function(req) {
            req['output-action'] = { 'output-node-connector': 'LOOPBACK' };
        };
      };

      buildCbks.floodAction = function(prop){
        return function(req) {
            req['output-action'] = { 'output-node-connector': 'FLOOD' };
        };
      };

      buildCbks.floodallAction = function(prop){
        return function(req) {
            req['output-action'] = { 'output-node-connector': 'FLOOD_ALL' };
        };
      };

      // REQUEST DATA CALLBACKS
      reqDataCbks.emptyObjAction  = function(prop){
        return function(data) {
            return data[prop.label] && $.isEmptyObject(data[prop.label]);
        };
      };

      reqDataCbks.popvlanAction = function(prop){
        return function(data) {
            return data['pop-vlan-action'] && $.isEmptyObject(data['pop-vlan-action']);
        };
      };

      reqDataCbks.controllerAction = function(prop){
        return function(data) {
            var valid = (prop.userData.order === undefined || prop.userData.order > data['order']) &&
                        (data['output-action'] && data['output-action'].hasOwnProperty('output-node-connector') && data['output-action']['output-node-connector'] === 'CONTROLLER');

            if(valid) {
                if(data['output-action'].hasOwnProperty('max-length')) {
                    prop.children[0].value = data['output-action']['max-length'];
                }
                prop.userData.order = data['order'];
            }

            return valid;
        };
      };

      reqDataCbks.normalAction = function(prop){
        return function(data) {
            var valid = (prop.userData.order === undefined || prop.userData.order > data['order']) &&
                        (data['output-action'] && data['output-action'].hasOwnProperty('output-node-connector') && data['output-action']['output-node-connector'] === 'NORMAL');

            if(valid) {
                if(data['output-action'].hasOwnProperty('max-length')) {
                    prop.children[0].value = data['output-action']['max-length'];
                }
                prop.userData.order = data['order'];
            }

            return valid;
        };
      };

      reqDataCbks.loopbackAction = function(prop){
        return function(data) {
            return data['output-action'] && data['output-action']['output-node-connector'] === 'LOOPBACK';
        };
      };

      reqDataCbks.floodAction = function(prop){
        return function(data) {
            return data['output-action'] && data['output-action']['output-node-connector'] === 'FLOOD';
        };
      };

      reqDataCbks.floodallAction = function(prop){
        return function(data) {
            return data['output-action'] && data['output-action']['output-node-connector'] === 'FLOOD_ALL';
        };
      };

      // DISPLAY OVERRIDE CALLBACKS

      displayOverrideCbks.portNumber = function(prop) {
          return function(data, selDevice) {
              return (selDevice ? (selDevice.id + ':') : '') + data;
          };
      };

      // Input: word (string) - value to find
      // Returns: (boolean)
      // Description: function searches array of reserved words and returns boolean:
      //    - true - if 'word' is in array of reserved words
      //    - false - if 'word' is not in array of reserved words
      var isOutputActionReservedWord = function(word) {
        var reservedWords = ['LOOPBACK','FLOOD','FLOOD_ALL','CONTROLLER','NORMAL'];

        return reservedWords.indexOf(word) < 0 ;
      };

      reqDataCbks.outputPortAction = function(prop){
        return function(data) {
            var valid = (prop.userData.order === undefined || prop.userData.order > data['order']) &&
                        (data['output-action'] && data['output-action'].hasOwnProperty('output-node-connector') && isOutputActionReservedWord(data['output-action']['output-node-connector'])) &&
                        prop.children[0].value === null && prop.children[1].value === null;

            if(valid) {
                prop.children[0].value = data['output-action']['output-node-connector'];
                if(data['output-action'].hasOwnProperty('max-length')) {
                    prop.children[1].value = data['output-action']['max-length'];
                }
                prop.userData.order = data['order'];
            }

            return valid;
        };
      };

      reqDataCbks.outputPortAction2 = function(prop){
        return function(data) {
            var outputPort = prop.parent.children.filter(function(child){
                               return child.displayLabel === 'OF_OUT_PORT';
                             })[0];

            var valid = (prop.userData.order === undefined || prop.userData.order < data['order']) &&
                        (data['output-action'] && data['output-action'].hasOwnProperty('output-node-connector') && isOutputActionReservedWord(data['output-action']['output-node-connector'])) &&
                        // workaround data duplicate to both ports when only one is filled
                        outputPort.children[0].value !== data['output-action']['output-node-connector'];

            if(valid) {
                prop.children[0].value = data['output-action']['output-node-connector'];
                if(data['output-action'].hasOwnProperty('max-length')) {
                    prop.children[1].value = data['output-action']['max-length'];
                }
                prop.userData.order = data['order'];
            }

            return valid;
        };
      };

      var ipv4Placeholder = '255.255.255.255/32',
          ipv6Placeholder = 'FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF',
          macPlaceholder = 'FF:FF:FF:FF:FF:FF',
          portPlaceholder = '0-65535',
          vladIdPlaceholder = '0-4095',
          vladPcpPlaceholder = '0-7',
          tosPlaceholder = '0-63';


      
      p.createProperties = function(key) {
          var properties = null;

          if(key in propetiesFactory) {
              properties = propetiesFactory[key]();
          }

          return properties;
      };

      p.getPropWithPermVal = function(props, actions){
        var propWitPerm = [];

         props.forEach(function(prop){
            if ( prop.displayLabel === 'OF_IN_PORT' ){
              propWitPerm.push(prop);
            }
          });

          actions.forEach(function(action){
              if ( action.displayLabel === 'OF_OUT_PORT' || action.displayLabel === 'OF_OUT_PORT_2' ) {
                action.children.forEach(function(child){
                  if ( child.displayLabel === 'OF_OUT_PORT' ) {
                    propWitPerm.push(child);
                  }
                });
              }
          });

          return propWitPerm;
      };

      p.createFlowRequest = function(flowProps, actionProps) {
          var req = {};

          flowProps.forEach(function(fp) {
              fp.build(req);
          });

          var actionList = actionProps.map(function(afp, index) {
              var actionReq = {order: index};

              afp.build(actionReq);
              return actionReq;
          });

          if($.isEmptyObject(req) === false && actionList.length) {
              req.instructions = {
                  instruction: [
                      {
                          order: 0,
                          'apply-actions': {
                              action: actionList
                          }
                      }
                  ]
              };
          }

          return { flow: [req]};
      };

      p.getReqProp = function(req, propName) {
          return req.flow && req.flow.length > 0 ? req.flow[0][propName] : null;
      };

      p.FlowValueProp = FlowValueProp;
      p.FlowContainerProp = FlowContainerProp;

      p.getCheckCallback = function(checkCbkLabel) {
          return checksCbks.hasOwnProperty(checkCbkLabel) ? checksCbks[checkCbkLabel] : null;
      };

      p.getChangeValCallback = function(changeValLabel) {
        return changeValCbks.hasOwnProperty(changeValLabel) ? changeValCbks[changeValLabel] : null;
      };

      p.getBuildCallback = function(buildCbkLabel, property) {
          return buildCbks.hasOwnProperty(buildCbkLabel) ? buildCbks[buildCbkLabel](property) : null;
      };

      p.getReqDataCallback = function(reqDataCbkLabel, property) {
          return reqDataCbks.hasOwnProperty(reqDataCbkLabel) ? reqDataCbks[reqDataCbkLabel](property) : null;
      };

      p.getDisplayOverrideCallback = function(displayOverrideCbkLabel, property) {
          return displayOverrideCbks.hasOwnProperty(displayOverrideCbkLabel) ? displayOverrideCbks[displayOverrideCbkLabel](property) : null;
      };


      p.getDevicePipelines = function(deviceType, confObj) {
          var selectedDevList = confObj.filter(function(item){
                return deviceType === item['device_type'];
              }),
              pipelines = [];

          if(selectedDevList.length) {
              pipelines = selectedDevList[0].pipelines;
          }

          return pipelines;
      };

      p.getPipelineTableIDs = function(pipelines){
          var ids = [];

          pipelines.forEach(function(p) {
              p.tables.forEach(function(t) {
                  ids.push({pip: p.id, tid: t});
              });
          });

          return ids;
      };

      p.types = {
          mandatory: mandatory,
          mod_fixed: mod_fixed,
      };

      p.__test = {
        FlowValueProp : FlowValueProp,
        FlowContainerProp : FlowContainerProp,

        getRestrictions : getRestrictions,
        getNestedReqObj : getNestedReqObj
      };

      return p;
      
  }]);

  openFlowManager.register.factory('OpenFlowManagerUtils', [ '$http', 'OpenFlowManagerConfigRestangular', 'FlowProcessor', 'StatisticsProcessor', 
    function($http, OpenFlowManagerConfigRestangular, FlowProcessor, StatisticsProcessor) {

      var utils = {};

      utils.ofVersionEnum = {
          NONE: 0,
          OF10: 'of10',
          OF13: 'of13'
      };

      utils.loadDevicesConfig = function(successCbk, errorCbk) {
          var path = 'assets/data/of_device_config.json';

          $http.get(path).success(function(data) {
              successCbk(data.devices);
          }).error(function() {
              console.warn('cannot load file '+ path);
              errorCbk();
          });
      };

      utils.objToList = function(obj) {
          return Object.keys(obj).map(function(key) {
              return obj[key];
          });
      };

      utils.getListElemByProp = function(list, propName, propValue) {
          var res = list.filter(function(e) {
              return e[propName] === propValue;
          })[0] || null;

          return res;
      };

      utils.sendFlow = function(device, table, flow, flowData, successCbk, errorCbk) {
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('config').one('opendaylight-inventory:nodes').one('node', device).one('table', table).one('flow', flow),
              checkNecesseryProps = function(data, props){
                props.forEach(function(prop){
                  data.flow[0][prop.name] = data.flow[0][prop.name] ? data.flow[0][prop.name] : prop.value;
                });

                return data;
              },
              necessaryProps = [{name: 'hard-timeout', value: '0'},
                                {name: 'idle-timeout', value: '0'},
                                {name: 'installHw', value: 'false'},
                                {name: 'strict', value: 'false'}
                                // {name: 'barrier', value: 'false'}
                                ];

          flowData = checkNecesseryProps(flowData, necessaryProps);

          restObj.customPUT(flowData).then(function(data) {
              successCbk(data);
          }, function(res) {
              errorCbk(res.data, res.status);
          });
      };

      utils.deleteFlow = function(device, table, flow, successCbk, errorCbk){
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('config').one('opendaylight-inventory:nodes').one('node', device).one('table', table).one('flow', flow);

          restObj.remove().then(function(data) {
              successCbk(data);
          }, function(res) {
              errorCbk(res.data, res.status);
          });
      };

      utils.getReqDataForDeleteOperationalFlow = function(flow, tableId){
          return {input : {
                    match: flow.data.match,
                    table_id: tableId,
                    priority: flow.data.priority,
                    node : "/opendaylight-inventory:nodes/opendaylight-inventory:node[opendaylight-inventory:id='" + flow.device +"']"}
                  };
      };

      utils.deleteFlowOperational = function(flow, tableId, flowId, successCbk, errorCbk){
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('operations'),
              reqData = utils.getReqDataForDeleteOperationalFlow(flow, tableId);

          restObj.post('sal-flow:remove-flow', reqData).then(function(data) {
              successCbk(data);
          }, function(res) {
              errorCbk(res.data, res.status);
          });
      };

      utils.getAllStatistics = function(successCbk, errorCbk, type) {
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('operational').one('opendaylight-inventory:nodes');

          restObj.get().then(function(data) {
              successCbk(data.nodes.node);
          }, function(res) {
              errorCbk(res.data, res.status);
          });
      };

      utils.getFlowsNetwork = function(successCbk, errorCbk) {
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('config').one('opendaylight-inventory:nodes');

          restObj.get().then(function(data) {
              successCbk(FlowProcessor.network(data.nodes.node));
          }, function(res) {
              errorCbk(res.data, res.status);
          });
      };

      utils.getOperFlowsNetwork = function(deviceFilter, successCbk, errorCbk) {
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('operational').one('opendaylight-inventory:nodes');

          restObj.get().then(function(data) {
              successCbk(FlowProcessor.networkOperational(data.nodes.node, deviceFilter));
          }, function(res) {
              errorCbk(res.data, res.status);
          });
      };

      utils.mapFlowsOperational = function(configFlows, deviceFilter, successCbk, errorCbk) {
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('operational').one('opendaylight-inventory:nodes'),
              isInOperational = function(device_id, operflow) {
                  var flow = configFlows.filter(function(cf) {
                          return cf.data.id === operflow.id && cf.data.table_id === operflow.table_id && cf.device === device_id;
                      })[0];

                  return flow;
              },
              getAllFlows = function(nodes) {
                  var operFlows = FlowProcessor.networkOperational(nodes, deviceFilter, isInOperational),
                      onlyConfigFlows = configFlows.filter(function(flow) {
                          return flow.operational === 1;
                      }),
                      allFlows = operFlows.concat(onlyConfigFlows);

                  return allFlows;
              };

          restObj.get().then(function(data) {
              successCbk(getAllFlows(data.nodes.node));
          }, function(res) {
            errorCbk(res.data, res.status);
          });
      };

      utils.getDevices = function(successCbk, errorCbk) {
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('operational').one('opendaylight-inventory:nodes');

          var setAdditionalProperties = function(nodes) {
              return nodes.map(function(node) {
//                  utils.getDeviceVersion(node.id, function(ver) {
//                      node.version = utils.ofVersionEnum[ver];
//                  }, function(){
//                      node.version = utils.ofVersionEnum.OF13;
//                  });
                  node.version = utils.ofVersionEnum.OF13;

//                  utils.getDeviceDeploymentMode(node.id, function(deploymentMode) {
//                      node.deploymentMode = deploymentMode;
//                  }, function(){
//                  });
                  node.deploumentMode = '';
                  

                  return node;
              });
          };

          var excludeMountedDevices = function(devices){
              return devices.filter(function(dev){
                  return dev.hasOwnProperty('netconf-node-inventory:connected') === false;
              });
          };

          restObj.get().then(function(data) {
              var devices = data.nodes.node,
                  excluded = excludeMountedDevices(devices),
                  modified = setAdditionalProperties(excluded);

              successCbk(modified);
          }, function(res) {
              errorCbk(res.data, res.status);
          });
      };

      utils.transformTopologyData = function (data, callback) {
          var links = [],
              nodes = [],
              getNodeIdByText = function getNodeIdByText(inNodes, text) {
                  var nodes = inNodes.filter(function (item, index) {
                          return item.label === text;
                      }),
                      nodeId = null;

                  if (nodes.length > 0 && nodes[0]) {
                      nodeId = nodes[0].id;
                  }

                  return nodeId;
              };


          if (data['network-topology'] && data['network-topology'].topology.length) {
              var topoData = callback ? callback(data['network-topology'].topology) : data['network-topology'].topology[0],
                  nodeId = 0,
                  linkId = 0;

              nodes = topoData.hasOwnProperty('node') ? topoData.node.map(function (nodeData) {
                  return {'id': (nodeId++).toString(), 'label': nodeData["node-id"], group: nodeData["node-id"].indexOf('host') === 0 ? 'host' : 'switch', value: 20, title: 'Name: <b>' + nodeData["node-id"] + '</b><br>Type: Switch', rawData: nodeData};
              }) : [];

              links = topoData.hasOwnProperty('link') ? topoData.link.map(function (linkData) {
                  var srcId = getNodeIdByText(nodes, linkData.source["source-node"]),
                          dstId = getNodeIdByText(nodes, linkData.destination["dest-node"]),
                          srcPort = linkData.source["source-tp"],
                          dstPort = linkData.destination["dest-tp"];
                  if (srcId != null && dstId != null) {
                      return {id: (linkId++).toString(), 'from': srcId, 'to': dstId, title: 'Source Port: <b>' + srcPort + '</b><br>Dest Port: <b>' + dstPort + '</b>', rawData: linkData};
                  }
              }) : [];
          }

          return {nodes: nodes, links: links};
      };

      utils.getTopologyData = function(successCbk, errorCbk){
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('operational').one('network-topology:network-topology');

          restObj.get().then(function(data) {
            successCbk(utils.transformTopologyData(data, function(topology){

              var topoItem = {};
              topology.some(function(topo){
                    var cond = (topo['topology-id'].indexOf('flow') === 0);
                    if (cond){
                        topoItem = topo;
                    }

                    return cond;
                });

              return topoItem;

            }), data);
          }, function(res) {
            errorCbk(res.data, res.status);
          });
      };

      // Input:
      //    successCbk (function) - success callback, applies when request returns value
      //    errorCbk (function) - error callback, applies when request failes
      // Returns:
      //    array of hosts
      // Description:
      //    Function for getting host data from topology
      utils.getHostData = function(successCbk, errorCbk){
        var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('operational').one('network-topology:network-topology'),
            filteredHostData = function(data){
                var filteredData = [],
                    topology = (data['network-topology'] && data['network-topology'].topology) ? data['network-topology'].topology : [],
                    topoItem = null;

                topology.some(function(topo){
                  var cond = (topo['topology-id'].indexOf('flow') === 0);
                    if (cond){
                        topoItem = topo;
                    }

                  return cond;
                });

                if (topoItem && topoItem.node){
                    filteredData = topoItem.node.filter(function(i){
                        return i['node-id'].indexOf('host') === 0;
                    });
                } 

                return filteredData;
            };

        restObj.get().then(function(data) {
          successCbk(filteredHostData(data));
        }, function(res) {
          errorCbk(res.data, res.status);
        });
      };

      // Input:
      //    deviceId (string) - id of device
      //    successCbk (function) - success callback, applies when request returns value
      //    errorCbk (function) - error callback, applies when request failes
      // Returns:
      //
      // Description:
      //    Function checks version of open flow protocol for specific device and calls appropriate callback.
      utils.getDeviceVersion = function(deviceId, successCbk, errorCbk) {
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('operations'),
              reqData = {input : {node : "/opendaylight-inventory:nodes/opendaylight-inventory:node[opendaylight-inventory:id='" + deviceId +"']"}};

          restObj.post('of-switch-version-provider:get-version', reqData).then(function(data) {
              successCbk(data.output.version);
          }, function(res) {
              errorCbk(res.data, res.status);
          });

      };

      utils.getDeploymentMode = function(successCbk, errorCbk) {
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('operations'),
              reqData = 'null';

          restObj.post('deployment-mode:get-deployment-mode', reqData).then(function(data) {
              successCbk(data['output']['deployment-mode']);
          }, function(res) {
              var defaultValue = null;
              //TODO when api for getting default value will be working
              // restObj.post('deployment-mode:get-deployment-mode', reqData).then(function(data) {
              //     defaultValue = data['output']['deployment-mode'];
              // }, function(errRes){
                  defaultValue = 'REACTIVE';
              // }
              errorCbk(defaultValue);
          });
      };

      utils.getDeviceDeploymentMode = function(deviceId, successCbk, errorCbk) {
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('operations'),
              reqData = {input : {node : "/opendaylight-inventory:nodes/opendaylight-inventory:node[opendaylight-inventory:id='" + deviceId +"']"}};

          restObj.post('node-deployment-mode:get-node-deployment-mode', reqData).then(function(data) {
              successCbk(data['output']['deployment-mode']);
          }, function(res) {
              errorCbk(res.data, res.status);
          });

      };

      utils.changeCtrlDeploymentMode = function(mode, successCbk, errorCbk) {
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('operations'),
              reqData = {input : {"deployment-mode": mode}};

          restObj.post('deployment-mode:set-deployment-mode', reqData).then(function(data) {
              successCbk(data);
              console.info('succes set deployment type mode',mode);
          }, function(res) {
              errorCbk(res.data, res.status);
              console.error('error set deployment type res',res,'status',status,'mode',mode);
          });
      };

      utils.changeDeviceDeploymentMode = function(mode, deviceId, successCbk, errorCbk) {
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('operations'),
              reqData = {input : {node : "/opendaylight-inventory:nodes/opendaylight-inventory:node[opendaylight-inventory:id='" + deviceId +"']", "deployment-mode": mode}};

          restObj.post('node-deployment-mode:set-node-deployment-mode', reqData).then(function(data) {
              successCbk();
          }, function(res) {
              errorCbk(res.data, res.status);
          });

      };

      utils.getSettingsConfig = function(successCbk){
          var path = 'assets/data/ofm_config.json';

              $http.get(path).success(function(data) {
                  var sliderOptions = {
                      from: data.refreshFrequency.statistics.min,
                      to: data.refreshFrequency.statistics.max,
                      step: 1,
                      dimension: " ",
                      scale: ['|', '|', '|', '|'],
                      css: {
                        background: {"background-color": "silver"},
                        default: {"background-color": "white"},
                        pointer: {"background-color": "red"}
                      }
                  };

                  var opts = { sliderOptions: sliderOptions, deplyomentOptions: data.deploymentModes};
                  successCbk(opts);
              });
      };

      utils.getStatisticsSettings = function(successCbk, errorCbk){
          var restObj = OpenFlowManagerConfigRestangular.one('restconf').one('config').one('opendaylight-inventory:nodes').one('node').one('controller-config').one('yang-ext:mount').one('config:modules').one('module').one('statistics-manager:statistics-manager').one('statistics-manager');

          restObj.get().then(function(data){
              console.debug('got stats', data);
              successCbk(data.module[0]['statistics-manager:statistics-manager-settings']['min-request-net-monitor-interval']);
          }, function(res){
              errorCbk();
          });
      };

      utils.changeStatistics = function(value, successCbk, errorCbk){
          var valueMiliseconds = value * 1000,
              restObj = OpenFlowManagerConfigRestangular.one('restconf').one('config').one('opendaylight-inventory:nodes').one('node').one('controller-config').one('yang-ext:mount'),
              reqData = '<module xmlns="urn:opendaylight:params:xml:ns:yang:controller:config">'+
                          '<type xmlns:prefix="urn:opendaylight:params:xml:ns:yang:controller:md:sal:statistics-manager">prefix:statistics-manager</type>'+
                          '<name>statistics-manager</name>'+
                          '<notification-service xmlns="urn:opendaylight:params:xml:ns:yang:controller:md:sal:statistics-manager">'+
                            '<name>binding-notification-broker</name>'+
                            '<type xmlns:prefix="urn:opendaylight:params:xml:ns:yang:controller:md:sal:binding">prefix:binding-notification-service</type>'+
                          '</notification-service>'+
                          '<statistics-manager-settings xmlns="urn:opendaylight:params:xml:ns:yang:controller:md:sal:statistics-manager">'+
                            '<min-request-net-monitor-interval>'+valueMiliseconds+'</min-request-net-monitor-interval>'+
                            '<max-nodes-for-collector>16</max-nodes-for-collector>'+
                          '</statistics-manager-settings>'+
                          '<data-broker xmlns="urn:opendaylight:params:xml:ns:yang:controller:md:sal:statistics-manager">'+
                            '<name>binding-data-broker</name>'+
                            '<type xmlns:prefix="urn:opendaylight:params:xml:ns:yang:controller:md:sal:binding">prefix:binding-async-data-broker</type>'+
                          '</data-broker>'+
                          '<rpc-registry xmlns="urn:opendaylight:params:xml:ns:yang:controller:md:sal:statistics-manager">'+
                            '<name>binding-rpc-broker</name>'+
                            '<type xmlns:prefix="urn:opendaylight:params:xml:ns:yang:controller:md:sal:binding">prefix:binding-rpc-registry</type>'+
                          '</rpc-registry>'+
                        '</module>';
                      

          restObj.post('config:modules', reqData, {'Accept':'application/xml'}, {'Content-Type':'application/xml'}).then(function(data) {
              successCbk(data);
              console.info('succes set statistics timer');
          }, function(res) {
              errorCbk(res.data, res.status);
              console.error('error set statistics timer res',res,'status',status,'value',value,'restObj',restObj);
          });
      };

      return utils;
  }]);

  openFlowManager.register.factory('OFConstants', function() {
      var c = {};

      c.sliderDefaultValue = -1;
      c.sliderconfig = {"from":3,"to":10,"step":1,"dimension":" ","scale":["|","|","|","|"],"css":{"background":{"background-color":"silver"},"default":{"background-color":"white"},"pointer":{"background-color":"red"}}};
      c.deploymentModes = [ "PROACTIVE", "REACTIVE", "INTEGRATED" ];

      return c;
  });

  openFlowManager.register.factory('DesignOFMfactory', ['designUtils', function(designUtils) {
    var designUtilsOfm = {};

    designUtilsOfm.setMainClass = function(cbk){
      if ( $('.openFlowManager').length ) {
          // $('.openFlowManager').closest('.row').addClass('openFlowManagerWrapper');
          $('.openFlowManager').closest('.col-xs-12').addClass('openFlowManagerWrapper');

          $('.openFlowManagerWrapper, #graph-container').height($(window).height() - 116);

          $(window).resize(function(){
            $('.openFlowManagerWrapper,  #graph-container').height($(window).height() - 116);
          });

          cbk();

      }
    };

    designUtilsOfm.setDraggablePopups = designUtils.setDraggablePopups();

    designUtilsOfm.ableModal = function(divClass){
      // $('body').css('overflow','hidden');
      $(divClass).css({'overflow-y':'scroll', height: 'calc(100% - 162px)'});
    };

    designUtilsOfm.disableModal = function(divClass){
      // $('body').css('overflow','visible');
      $(divClass).attr('style','');
    };

    designUtilsOfm.resetBodyTag = function(){
      $('body').attr('style','');
    };

    return designUtilsOfm;
  }]);

  openFlowManager.register.factory('IpFactory', function() {
      var ipf = {};

      ipf.splitCidrNotation = function(cidrNotation) {
          return cidrNotation.split('/');
      };

      ipf.getNerworkAddress = function(cidrNotation) {
          var cidrParts = ipf.splitCidrNotation(cidrNotation);

          return ipf.networkAddressCompute(cidrParts[0], cidrParts[1]);
      };

      ipf.splitIpAddressToOctets = function(ipAddress) {
          return ipAddress.split('.');
      };

      ipf.ipAddressOctetsToBinary = function(ipAddressOctets) {
          var ipAddressBinary = "";

          ipAddressOctets.forEach(function(part){
              ipAddressBinary += String("00000000" + Number(part).toString(2)).slice(-8);
          });

          return ipAddressBinary;
      };

      ipf.cidrRoutingPrefixToBinary = function(cidrRoutingPrefix) {
          var arr = new Array(Number(cidrRoutingPrefix)+1).join('1');
          return String(arr + "00000000000000000000000000000000").substring(0, 32);
      };

      ipf.networkAddressCompute = function(ipAddress, cidrRoutingPrefix) {
          var ipAddressBinary = ipf.ipAddressOctetsToBinary(ipf.splitIpAddressToOctets(ipAddress)),
              netmaskBinary = ipf.cidrRoutingPrefixToBinary(cidrRoutingPrefix),
              networkAdressBinary = ""; 

         
          for( pos = 0; pos < 32; pos ++ ) {
              ipBit = ipAddressBinary.substring(pos, pos+1);
              nmBit = netmaskBinary.substring(pos, pos+1);

              networkAdressBinary += (ipBit === nmBit) ?  nmBit : "0";
          }
          
          return  parseInt(networkAdressBinary.substr(0,8), 2) + "." +
                  parseInt(networkAdressBinary.substr(8,8), 2) + "." +
                  parseInt(networkAdressBinary.substr(16,8), 2) + "." +
                  parseInt(networkAdressBinary.substr(24,8), 2) + "/" +
                  cidrRoutingPrefix;
      };

      return ipf;
  });

});