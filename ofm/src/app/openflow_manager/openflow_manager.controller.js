var modules = ['app/openflow_manager/openflow_manager.module',
               'app/openflow_manager/openflow_manager.services',
               'app/openflow_manager/openflow_manager.filters',
               'common/yangutils/yangutils.services',
//               'common/tagutils/tagutils.services',
               'app/openflow_manager/directives/next_topology.directive',
               'app/openflow_manager/directives/ofmanpagination.directive',
               'app/openflow_manager/directives/tablestats.directive'];


define(modules, function(openflow_manager) {

    openflow_manager.register.controller('openflow_managerCtrl', ['$scope', '$rootScope', '$http', '$timeout', 'OpenFlowManagerUtils', 'FlowProcessor', 'StatisticsProcessor', 'DesignOFMfactory','$animate', 'FlowProperties', 'CommonFlowOpers', 'IpFactory', 'ngTableParams', '$filter', 'Auth', 'ENV',
        function ($scope, $rootScope, $http, $timeout, OpenFlowManagerUtils, FlowProcessor, StatisticsProcessor, DesignOFMfactory, $animate, FlowProperties, CommonFlowOpers, IpFactory, NgTableParams, $filter, Auth, ENV) {
            $rootScope['section_logo'] = 'logo_ofm';
            $scope.view_path =  'src/app/openflow_manager/views/';
            $scope.topologyData = { nodes: [], edges: []};
            $scope.topologyNode = null;
            $scope.flowData = null;
            $scope.devices = {};
            $scope.statisticsTimerSlider = 3;
            $scope.ofmSettings = {};
            $scope.tagConfigTopology = null;

            $scope.view_path_flow_detail = $scope.view_path + 'flow_detail/';
            $scope.view_path_flow_subctrl = $scope.view_path_flow_detail + 'flowOperSubCtrls/';
            $scope.view_path_flow_detail_types = $scope.view_path_flow_detail + 'types/';

            $scope.view = {
                flowPopup : false,
                flowOperPopup : false,
                statisticsPopup : false,
                settingsPopup : false,
                tagsPopup : false,
                flowsFilter : false,
                showPreview: false,
                hostsPopup: false,
                basic: true
            };

            $scope.checkOperChangeTimeout = 3000;

            $scope.showHostDevice = false;
            $scope.linkExpanded = false;

            $scope.showTopStatsPopup = false;
            $scope.popStatObj = {
                device: null,
                type: null,
                subType: null
            };

            $scope.status = {
                type: 'noreq',
                msg: null
            };

            $scope.isContainer = function(p) {
              return p instanceof FlowProperties.FlowContainerProp;
            };

            $scope.removeFlowProperty = function(prop, propList) {
                CommonFlowOpers.removeFlowProperty(prop, propList);
            };

            $scope.requestWorkingCallback = function() {
                $scope.status = {
                    isWorking: true,
                    type: 'warning',
                    msg: 'OF_LOADING_DATA'
                };
            };

            $scope.processingModulesSuccessCallback = function() {
                $scope.status = {
                    type: 'success',
                    msg: ''
                };
            };

            $scope.topoExpandLink = function(){
                var collapseExpandLinks = function(status){
                    $scope.topo.getLayer('linkSet').eachLinkSet(function(l){
                        l.collapsedRule(status);
                        l.updateLinkSet();
                    });
                };

                if ( $scope.linkExpanded  ) {
                    collapseExpandLinks(false);
                } else {
                    collapseExpandLinks(true);
                }

            };

            $scope.showPopUpStatistics = function(type, subType){
                $scope.popStatObj.type = type;
                $scope.popStatObj.subType = subType;

                $scope.$broadcast('OM_SET_SEL_DEV', $scope.popStatObj);
                // $scope.view.statisticsPopup = true;
                $scope.toggleExpanded('statisticsPopup', true);
            };

            $scope.hideTopStatsPopup = function(){
                $scope.showTopStatsPopup = false;
            };

            $scope.customFunctionality = {
                setStatisticsDevice : function(device, show){
                    $scope.showTopStatsPopup = show;
                    $scope.popStatObj.device = device;
                    $scope.$apply();
                },
                setTagToDevice : function (device, selected) {
                    $scope.showTopStatsPopup = $scope.showTopStatsPopup ? false : $scope.showTopStatsPopup;
                    $scope.$broadcast('OM_SET_TAG_TO_DEVICE', device, selected);
                    $scope.$apply();
                },
                setTagToLink : function(link){
                    $scope.$broadcast('OM_SET_TAG_TO_LINK', link.sourceNode()._label, link.targetNode()._label);
                    $scope.$apply();
                }
            };

            $scope.flows = [];
            $scope.filters = [];
            $scope.selectedFlows = [];
            $scope.selectedOriginalFlows = [];
            $scope.selectedDevices = {};
            $scope.selectedDevicesList = [];
            $scope.filtersActive = false;
            $scope.summaryExpanded = true;
            $scope.deletingFlows = [];
            $scope.updatingFlows = [];

            $scope.loadStatusMsgs = [];
            $scope.loadStatusTopoMsgs = [];
            $scope.successSentFlows = [];
            $scope.hostTopologyData = [];

            $scope.addStatusMessage = function(msg) {
                if($scope.loadStatusMsgs.indexOf(msg) === -1) {
                    $scope.loadStatusMsgs.push(msg);
                }
            };

            $scope.dismissLoadStatus = function() {
                $scope.loadStatusMsgs = [];
            };

            $scope.flowIsConfigured = function(flow) {
                return flow  ? (flow.operational === 2 || flow.operational === 3) : false;
            };

            $scope.onlyInOperational = function(flow) {
                return flow && flow.operational === 2;
            };

            $scope.onlyOperationalSelected = function(flows) {
                return flows.filter(function(f) {
                    return $scope.onlyInOperational(f);
                });
            };

            $scope.addEditFlow = function(flow){
                $scope.selectedFlows = [flow];
            };

            $scope.setSelFlows = function(flows){
                $scope.selectedFlows = flows;
            };

            $scope.appendEditFlow = function(){
                var flow = FlowProcessor.createEmptyFlow();
                    copy = $scope.selectedFlows.slice();

                copy.push(flow);
                $scope.selectedFlows = copy;
                return flow;
            };

            $scope.appendEditFilter = function(){
                var flow = FlowProcessor.createEmptyFlow();
                    copy = $scope.filters.slice();

                flow.name = 'Filter '+($scope.filters.length + 1)+' name';
                flow.active = 1;

                copy.push(flow);
                $scope.filters = copy;
                return flow;
            };

            $scope.deleteSelFlows = function(flow){
                var index = $scope.selectedFlows.indexOf(flow);

                if ( index !== -1 ) {
                    $scope.selectedFlows.splice(index, 1);
                }

                if ( !$scope.selectedFlows.length ) {
                    $scope.appendEditFlow();
                }
            };

            $scope.deleteSelFilter = function(flow){
                var index = $scope.filters.indexOf(flow);

                if ( index !== -1 ) {
                    $scope.filters.splice(index, 1);
                }

                if ( !$scope.filters.length ) {
                    $scope.appendEditFilter();
                }
            };

            $scope.successSentFlows = [];

            $scope.setSuccessAlert = function(data){
                $scope.successSentFlows.push(data);
            };

            $scope.dismissSuccessFlowStatus = function(){
                $scope.successSentFlows = [];
            };

            $scope.getDeviceById = function(id) {
                return $scope.devices[id]; 
            };

            $scope.getDevicesList = function(devices) {
                return Object.keys(devices).map(function(key) {
                    return devices[key];
                });
            };

            $scope.getDeviceType = function(device) {
                return device ? device['flow-node-inventory:hardware'] : '';
            };

            $scope.getDeviceTypeById = function(deviceId) {
                var device = $scope.getDeviceById(deviceId);

                return device ? device['flow-node-inventory:hardware'] : '';
            };

            $scope.getDeviceNameById = function(deviceId) {
                var device = $scope.getDeviceById(deviceId);

                return device ? device['flow-node-inventory:description'] : '';
            };

            $scope.getDeviceFullName = function(device) {
                return device.id + ' [' + device['flow-node-inventory:description'] +'] [' + $scope.getDeviceType(device) +']';
            };

            $scope.getDeviceFullNameById = function(deviceId) {
                var device = $scope.getDeviceById(deviceId);

                return device ? $scope.getDeviceFullName(device) : deviceId;
            };

            $scope.propertiesExpanded = true;
            $scope.propertiesExpand = function() {
                $scope.propertiesExpanded = !$scope.propertiesExpanded;
            };

            $scope.actionsExpanded = true;
            $scope.actionsExpand = function() {
                $scope.actionsExpanded = !$scope.actionsExpanded;
            };

            $scope.matchExpanded = true;
            $scope.matchExpand = function() {
                $scope.matchExpanded = !$scope.matchExpanded;
            };

            var updatePopUpData = function(){
                if ( $scope.view.flowPopup ) {
                    $scope.loadFlows();
                }

                if ( $scope.view.statisticsPopup ) {
                    $scope.$broadcast('OM_RELOAD_STATS');
                }
            };

            $scope.toggleSelDevice = function(deviceId) {
                var device = $scope.devices[deviceId];

                if(device) {
                    var present = $scope.selectedDevices.hasOwnProperty(device.id);

                    if(present === false) {
                        $scope.selectedDevices[device.id] = device;
                    } else {
                        delete $scope.selectedDevices[device.id];
                    }
                    
                    var selList = $scope.getDevicesList($scope.selectedDevices);

                    $scope.selectedDevicesList = selList.length ? selList : $scope.getDevicesList($scope.devices);

                    $scope.selectedDevicesList.forEach(function(item){
                        item.checkedStats = item.id === deviceId ? true : item.checkedStats;
                    });

                    updatePopUpData();

                    return !present;
                } else {
                    console.warn('can\'t map id ',deviceId,'to any of inventory devices', $scope.devices);
                    return false;
                }
            };

            var getSelectedFilters = function() {
                $scope.filters = $scope.filters.slice();
            };

            var getSelectedFlows = function() {
                $scope.selectedFlows = [];
                $scope.selectedOriginalFlows = [];
                $scope.$broadcast('EV_GET_SEL_FLOW', function(flow) {
                    $scope.selectedFlows.push(flow);
                    $scope.selectedOriginalFlows.push(angular.copy(flow));
                });
            };

            $scope.checkDeletingArray = function() {
                if($scope.deletingFlows.length > 0) {
                    $timeout(function () {
                        $scope.loadFlows();
                    }, $scope.checkOperChangeTimeout);
                }
            };

            $scope.labelCbk = function(flow, defaultName) {
                var parseOperationalId = function(prop){
                    if(prop === 'id'){
                        return flow.operational === 2 ? 'CtrlGen ' + flow.data[prop].slice(flow.data[prop].indexOf('*')+1,flow.data[prop].length): flow.data[prop];
                    }else{
                        return flow.data[prop];
                    }
                };

                var getName = function(prop){
                    return flow.data ? flow.data[prop] !== undefined ? parseOperationalId(prop) : 'not set' : 'not set';
                };

                return flow.data ? flow.data['flow-name'] || '[id:'+ getName('id') +', table:'+ getName('table_id') +']' : defaultName || '-unnamed-';
            };

            $scope.dummyErrorCbk = function() {
                return false;
            };

            $scope.errorCbk = function(flow){
                return flow.error && flow.error.length;
            };

            $scope.modifySelectedFlows = function() {
                getSelectedFlows();
                $scope.toggleExpanded('flowOperPopup');
                $scope.successSentFlows = [];
            };

            $scope.modifySelectedFilters = function(){
                getSelectedFilters();
                $scope.toggleExpanded('flowsFilter');
            };

            $scope.deleteSelectedFlows = function() {
                getSelectedFlows();
                if($scope.selectedFlows.length) {
                    $scope.$broadcast('EV_DELETE_FLOWS', $scope.selectedFlows);
                }
            };

            $scope.clearEmptyFilters = function(){
                var getValue = function(filter){
                    for (var i in filter){
                        if(typeof filter[i] == 'object' && wasValueFound === false){
                            getValue(filter[i]);
                        }else if(filter[i] !== '' && wasValueFound ===false){
                            wasValueFound = true;
                        }
                    }
                };

                $scope.filters = $scope.filters.filter(function(fil){
                    wasValueFound = false;
                    getValue(fil.data);
                    return fil.device || wasValueFound;
                });
            };

            $scope.toggleExpanded = function(expand, show) {
                $scope.view[expand] = show ? true : !$scope.view[expand];
                for ( var property in $scope.view ) {
                    $scope.view[property] = expand !== property ? false : $scope.view[expand];
                }

                if ( $scope.view[expand] ) {
                    DesignOFMfactory.ableModal('.flowInfoWrapper');
                } else {
                    DesignOFMfactory.disableModal('.flowInfoWrapper');
                }

                $scope.$broadcast('EV_INIT'+expand.toUpperCase());
            };

            $scope.collapseAll = function(basic){
                for ( var prop in $scope.view ){
                    $scope.view[prop] = false;
                }

                if (basic) {
                    $scope.view.basic = true;
                    DesignOFMfactory.resetBodyTag();
                }

            };

            $scope.loadHostData = function(){
              $scope.$broadcast('INIT_HOST_DATA');
            };
            
            $scope.loadTopology = function(){
                OpenFlowManagerUtils.getTopologyData(function(topology, data){
                    $scope.topologyData = topology;
                    $scope.flowData = (data['network-topology'].topology[0].node && data['network-topology'].topology[0].node.length) ? data['network-topology'].topology[0].node : null;

                    if ( !topology.nodes.length ) {
                        $scope.loadStatusTopoMsgs.push('OF_FLOW_TOPO_FAIL');
                    }

                    $scope.$broadcast('OM_LOAD_TOPO_TAGS', data);
                }, function() {
                    $scope.addStatusMessage('OF_LOAD_TOPO_FAIL');
                    console.warn('cannot get topology info from controller');
                    Auth.logout();
                });
            };

            $scope.loadFlows  = function() {
                $scope.flows = [];
                $scope.successSentFlows = [];
                
                var filterFunction = ($.isEmptyObject($scope.selectedDevices) === false ?
                    function(device_id) {
                        return $scope.selectedDevices.hasOwnProperty(device_id);
                    } : 
                    function(flow) {
                        return true;
                    }
                );

                var processOperationalFlows = function(flowsArray) {
                    $scope.processDeletedFlows(flowsArray);
                    //$scope.processUpdatedFlows(flowsArray);
                    $scope.checkDeletingArray();
                };

                OpenFlowManagerUtils.getFlowsNetwork(function(flows){
                        var configflows = flows.filter(function(flow) {
                            return filterFunction(flow.device);
                        });

                    OpenFlowManagerUtils.mapFlowsOperational(configflows, filterFunction, function(mappedFlows) {
                        processOperationalFlows(mappedFlows);
                        $scope.flows = mappedFlows;
                        $scope.$broadcast('EV_GET_FLOWS');
                        $scope.$broadcast('EV_GET_FILTERS');
                    }, function() {
                        console.warn('can\'t access operational nodes data');
                    });
                }, function() {
                    OpenFlowManagerUtils.getOperFlowsNetwork(filterFunction, function(flows) {
                        processOperationalFlows(flows);
                        $scope.flows = flows;
                        $scope.$broadcast('EV_GET_FLOWS');
                        $scope.$broadcast('EV_GET_FILTERS');
                    }, function(){
                        console.warn('can\'t load flows from controller');
                    });
                });
            };

            $scope.loadFilters = function(){
                $scope.$broadcast('EV_GET_FILTERS');
            };

            $scope.loadDevices  = function() {
                OpenFlowManagerUtils.getDevices(
                    function(devices){
                        devices.forEach(function(d) {
                            $scope.devices[d.id] = d;
                            d.checkedStats = true;
                        });
                        $scope.selectedDevicesList = devices;
                        $scope.$broadcast('EV_GET_DEVICES');
                    },
                    function() {
                        $scope.addStatusMessage('OF_LOAD_INV_FAIL');
                        console.warn('cannot get devices info from controller');
                        Auth.logout();
                    }
                );

            };

            $scope.loadHosts = function(){
                //TODO chek if host tracking is enabled
                OpenFlowManagerUtils.getHostData(function(data){
                  $scope.hostTopologyData = data ? data : [];
                },
                function() {
                    // console.warn('cannot get hosts info from controller');
                });
            };

            $scope.loadAll = function() {
                DesignOFMfactory.setMainClass(function(){
                    $scope.loadTopology();
                    $scope.loadDevices();
                    $scope.loadHosts();
                });
            };

            // Input:
            //      - flows (array) - array of flows from controller
            // Returns:
            //      void
            // Description:
            //      Function sets 'deleting' property of flows matched to scope array '$scope.deletingFlows'.
            //      Also clears '$scope.deletingFlows' of deleted flows.
            $scope.processDeletedFlows = function(flows) {
                $scope.deletingFlows = $scope.deletingFlows.filter(function(df) {
                    return flows.some(function(f) {
                        return f.data.id === df;
                    });
                });

                flows.forEach(function(f) {
                    f.deleting = $scope.deletingFlows.indexOf(f.data.id) >= 0;
                });
            };

            // Input:
            //      - flows (array) - array of flows from controller
            // Returns:
            //      void
            // Description:
            //      Function sets 'updating' property of flows matched to scope array '$scope.updatingFlows'.
            $scope.processUpdatedFlows = function(flows) {
                var flowDataNormalize = function(flow) {
                        if(flow && flow.data && flow.data.match)
                        {
                            if(flow.data.match.hasOwnProperty('ipv4-destination'))
                            {
                                flow.data.match['ipv4-destination'] = IpFactory.getNerworkAddress(flow.data.match['ipv4-destination']);
                            }
                            if(flow.data.match.hasOwnProperty('ipv4-source'))
                            {
                                flow.data.match['ipv4-source'] = IpFactory.getNerworkAddress(flow.data.match['ipv4-source']);
                            }
                        }
                    },
                    // Input:
                    //      - flow1 (object) - flow
                    //      - flow2 (object) - flow
                    // Returns:
                    //      - (bool) 
                    // Description:
                    //      function compares two flow object parts (match, action) and returns true if are equal
                    compareFlowsData = function(flow1, flow2) {
                        flow1.data.match = flow1.data.match === undefined ? {} : flow1.data.match;
                        flow2.data.match = flow2.data.match === undefined ? {} : flow2.data.match;

                        flow1.data.instructions = flow1.data.instructions === undefined ? {} : flow1.data.instructions;
                        flow2.data.instructions = flow2.data.instructions === undefined ? {} : flow2.data.instructions;                        

                        return angular.equals(flow1.data.match,flow2.data.match) &&
                               angular.equals(flow1.data.instructions,flow2.data.instructions);
                    },
                    // Input:
                    //      - flow1 (object) - flow
                    //      - flow2 (object) - flow
                    // Returns:
                    //      - (bool) 
                    // Description:
                    //      function compares flow properties (table_id, priority and device) and returns true if are equal
                    compareFlowsMandatoryProperties = function(flow1, flow2) {
                        return  flow1.data.table_id === flow2.data.table_id &&
                                flow1.data.priority === flow2.data.priority &&
                                flow1.device        === flow2.device;
                    };

                $scope.updatingFlows = $scope.updatingFlows.filter(function(uf) {
                    flowDataNormalize(uf);

                    return flows.some(function(f) {
                        if(compareFlowsMandatoryProperties(f, uf))
                        {
                            if (!compareFlowsData(f, uf))
                            {
                                f.updating = true;
                                return true;
                            }  

                            return false;
                        }
                        
                    });
                });
            };

            var getDataTagsDevices = function(){
                return $scope.tagsForTable;
            };

            var getDataTagsDevicesLength = function(){
                return getDataTagsDevices() ? getDataTagsDevices().length : 0;
            };

            var refreshTagsTable = function() {
                $scope.tableParamsTags.reload();
            };

            var initTableTagsDevices = function(){
                $scope.tableParamsTags = new NgTableParams({
                    page: 1,
                    count: 5,
                    sorting: {
                        name: 'asc'
                    }
                }, {
                    total: getDataTagsDevicesLength(),
                    counts: [2,5,10,15,20],

                    getData: function($defer, params) {
                        var data = getDataTagsDevices(),
                            orderedData = params.sorting() ? $filter('orderBy')(data, params.orderBy()) : data;

                        params.total(orderedData.length);
                        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    }
                });
            };
            
            $scope.$on('OM_LOAD_TAGS', function(event, tags) {
                $scope.tagsForTable = tags;
                refreshTagsTable();
            });
            
            $scope.loadAll();
            initTableTagsDevices();

            $scope.tagsForTable = [];
            
        }
    ]);


    openflow_manager.register.controller('hostsCtrl',['$scope', '$filter', 'ngTableParams', 'HostsHandlerService', function($scope, $filter, NgTableParams, HostsHandlerService){

      $scope.hosts = [];
      $scope.tableParamsHosts = null;


      $scope.timestampToTime = function(timestamp){
        var a = new Date(timestamp),
            months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            year = a.getFullYear(),
            month = months[a.getMonth()],
            date = a.getDate(),
            hour = a.getHours(),
            min = a.getMinutes(),
            sec = a.getSeconds(),
            time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;

        return time;
      };

      var getData = function(){
        $scope.hosts = HostsHandlerService.getHostsData($scope.hostTopologyData);
        return $scope.hosts;
      };

      var initHostsTable = function(){

        $scope.tableParamsHosts = new NgTableParams({
          page: 1,
          count: 10,
          filter: {}
        }, {
          total: getData().length,
          counts: [10,15,20,25,30],
          getData: function($defer, params) {
            var alldata = getData(),
                orderedData = params.sorting() ? $filter('orderBy')(alldata, params.orderBy()) : alldata;

            // orderedData = getActiveFilter() ? applyFilter(orderedData) : orderedData;

            params.total(orderedData.length);
            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
          },
          $scope: { $data: {} }

        });



      };


      initHostsTable();

      $scope.$on('INIT_HOST_DATA', function(){
        $scope.tableParamsHosts.reload();
      });

    }]);

    openflow_manager.register.controller('statisticsCtrl', ['$scope', '$filter', '$timeout', 'ngTableParams', 'OpenFlowManagerUtils', 'StatisticsProcessor', function($scope, $filter, $timeout, NgTableParams, OpenFlowManagerUtils, StatisticsProcessor) {

            $scope.selectedDev = null;
            $scope.portStatistics = [];
            $scope.stats = null;
            $scope.tableType = 'TABLE';
            $scope.subStats = null;
            $scope.statisticsTimer = 300000;
            $scope.graphTableData = [];
            $scope.statisticsObj = [
                {
                    name: 'Table statistics',
                    funct: 'updateTableStats',
                    type: 'TABLE',
                    subStatistics: [
                        {
                            name: 'Flow stats',
                            funct: 'getFlowSstats'
                        },
                        {
                            name: 'Flow table stats',
                            funct: 'getFlowTstats'
                        },
                        {
                            name: 'Aggregate flow stats',
                            funct: 'getAggregateFstats'
                        }
                    ]
                },
                {
                    name: 'Ports statistics',
                    funct: 'updateGeneralStats',
                    subFunct: 'generalStatsByNodes',
                    serviceFunct: 'portStatsByNode',
                    container: 'opendaylight-port-statistics:flow-capable-node-connector-statistics',
                    type: 'PORT',
                    subStatistics: []
                },
                {
                    name: 'Queue statistics',
                    funct: 'updateGeneralStats',
                    subFunct: 'generalStatsByNodes',
                    serviceFunct: 'queueStatsByNode',
                    parentContainer: 'flow-node-inventory:queue',
                    container: 'opendaylight-queue-statistics:flow-capable-node-connector-queue-statistics',
                    type: 'QUEUE',
                    subStatistics: []
                },
                {
                    name: 'Group statistics',
                    funct: 'updateGeneralStats',
                    subFunct: 'getGMStats',
                    parentContainer: 'flow-node-inventory:group',
                    container: 'opendaylight-group-statistics:group-statistics',
                    type: 'GROUP',
                    subStatistics: []
                },
                {
                    name: 'Meter statistics',
                    funct: 'updateGeneralStats',
                    subFunct: 'getGMStats',
                    parentContainer: 'flow-node-inventory:meter',
                    container: 'opendaylight-meter-statistics:meter-statistics',
                    type: 'METER',
                    subStatistics: []
                },
                {
                    name: 'Meter features',
                    funct: 'updateGeneralStats',
                    subFunct: 'getMeterFeaturesStats',
                    container: 'opendaylight-meter-statistics:meter-features',
                    type: 'METERFEATURES',
                    subStatistics: []
                }
            ];

            var graphTableDataAll = [],
                getSelectedDeviceNames = function(){
                    return $scope.selectedDevicesList.map(function(dev){
                        if (dev.checkedStats){
                            return dev.id;
                        }
                    });
                };

            var getFilteredDataByDevice = function(){
                var selDevices = getSelectedDeviceNames();
                return graphTableDataAll.filter(function(item){
                            return selDevices.indexOf(item.origDevName) !== -1;
                        });
            };

            $scope.changeTplType = function(){
                $scope.tableType = $scope.stats.type;
            };

            $scope.getStatsData = function(notWarning){
                if ( !notWarning ) {
                    $scope.requestWorkingCallback();
                }

                OpenFlowManagerUtils.getAllStatistics(function(data) {
                    $scope.updateStatistics(data);
                    $scope.processingModulesSuccessCallback();
                },function() {});
                
            };

            $scope.gatherStatistics = function(notWarning) {
                $scope.getStatsData(notWarning);


                // OpenFlowManagerUtils.getPortStatistics(updatePortStats, function() {});
                $timeout(function () {
                    $scope.gatherStatistics(true);
                }, $scope.statisticsTimer);
            };

            $scope.changesDeviceNames = function(){
                graphTableDataAll.forEach(function(dev){
                  dev.origDevName = dev.device;
                  //console.log('dev', dev);
                  dev.device = $scope.getDeviceFullNameById(dev.device);

                  if ( dev['stats-array'] && dev['stats-array'].length ) {
                      dev['stats-array'].forEach(function(table){
                            table.DeviceType.value = $scope.getDeviceType($scope.getDeviceById(table.Device.value));
                        });
                    }
                });
            };

            $scope.updateTableStats = function(data){
                var tableStatsData = StatisticsProcessor.tableStatsByNodes(data);
                
                if ( $scope.subStats ) {
                    $scope.graphTableData = StatisticsProcessor.updateDataValue(StatisticsProcessor[$scope.subStats.funct](tableStatsData));

                    graphTableDataAll = $scope.graphTableData;

                    $scope.changesDeviceNames();

                    $scope.graphTableData = getFilteredDataByDevice();
                }
            };

            $scope.updateGeneralStats = function(data){

                if ( $scope.stats.subFunct ){

                    $scope.graphTableData = StatisticsProcessor.updateDataValue(StatisticsProcessor[$scope.stats.subFunct](data, $scope.stats));

                    graphTableDataAll = $scope.graphTableData;

                    $scope.changesDeviceNames();

                    $scope.graphTableData = getFilteredDataByDevice();
                }
                
            };

            $scope.updateDataFunc = function(){
              if($scope.userIsLogged){
                $scope.getStatsData();
              }  
            };

            $scope.toggleCheckedDev = function(device){
                device.checkedStats = !device.checkedStats;
                $scope.graphTableData = getFilteredDataByDevice();

            };

            $scope.updateStatistics = function(data){
                if ( $scope.stats ) {
                  //data = $scope.selectedDevicesList.length ? $scope.selectedDevicesList : data;
                    $scope[$scope.stats.funct](data);
                }

            };

            $scope.gatherStatistics();

            $scope.$on('OM_SET_SEL_DEV', function(name, obj) {
                // $scope.selectedDev = $scope.selectedDevicesList.filter(function(dev){
                //                         return dev.id === obj.device;
                //                      })[0];

                $scope.stats = $scope.statisticsObj[obj.type];
                $scope.subStats = obj.subType ? $scope.stats.subStatistics.filter(function(subS){
                                                    return subS.funct === obj.subType;
                                                })[0] : null;

                $scope.changeTplType();

                if ( obj.subType ){
                    $scope.getStatsData();
                }
            });

            $scope.$on('OM_RELOAD_STATS', function(){
                $scope.getStatsData();
            });
        }
    ]);

    openflow_manager.register.controller('flowInfoCtrl', ['$scope', '$filter', 'ngTableParams', 'modalWinServices', 'OpenFlowManagerUtils', '$interval', 'modalWinServicesDelete', function($scope, $filter, NgTableParams, modalWinServices, OpenFlowManagerUtils, $interval, modalWinServicesDelete) {
            $scope.checkboxes = { 'checked': false, items: {} };

            $scope.$watch('checkboxes.checked', function(value) {
                $scope.flows.forEach(function(flow) {
                    if(flow.hasOwnProperty('device') && flow.hasOwnProperty('data') && flow.data.hasOwnProperty('id') && flow.data.hasOwnProperty('table_id')){
                        $scope.checkboxes.items[flow.data.id+'@'+flow.data.table_id+'@'+flow.device] = value;
                    }
                });
            });

            $scope.$on('EV_GET_SEL_FLOW', function(ev, callback) {
                $scope.flows.forEach(function(flow) {
                    if((flow.hasOwnProperty('device') && flow.hasOwnProperty('data') && flow.data.hasOwnProperty('id') && flow.data.hasOwnProperty('table_id')) && 
                        $scope.checkboxes.items[flow.data.id+'@'+flow.data.table_id+'@'+flow.device]){
                        callback(flow);
                    }
                });
            });

            $scope.$watch('checkboxes.items', function(values) {
                if (!$scope.flows.length) {
                    return;
                }
                var checked = 0, unchecked = 0,
                    total = $scope.flows.length;
                angular.forEach($scope.flows, function(flow) {
                    checked   +=  ($scope.checkboxes.items[flow.data.id+'@'+flow.data.table_id+'@'+flow.device]) || 0;
                    unchecked += (!$scope.checkboxes.items[flow.data.id+'@'+flow.data.table_id+'@'+flow.device]) || 0;
                });
                if ((unchecked === 0) || (checked === 0)) {
                    $scope.checkboxes.checked = (checked === total);
                }
            }, true);

            var applyFilter = function(orderedData) {
                var filteredData = [],
                    getFilterResult = function(flow,filter) {
                        for (var i in filter){
                            if(typeof filter[i] == 'object'){
                                if(flow[i]){
                                    getFilterResult(flow[i],filter[i]);
                                }else{
                                    filterResult = false;
                                }
                            }else if(filterResult !== false){
                                filterResult = filter[i] == flow[i];
                            }
                        }
                    };

                return (getActiveFilter() && $scope.filters.length) ? orderedData.slice().filter(function(flow){
                    return $scope.filters.filter(function(fil){
                            return fil.active == 1;
                        }).some(function(filter){
                            filterResult = null;

                            if(filter.device){
                                if(filter.device == flow.device){
                                    filterResult = true;
                                    getFilterResult(flow.data,filter.data);
                                }else{
                                    filterResult = false;
                                }
                            }else{
                                getFilterResult(flow.data,filter.data);
                            }

                            return filterResult;
                        });
                }) : orderedData;
            };

            var getData = function() {
                return applyFilter($scope.flows);
            };

            var getDataLength = function() {
                return getData().length;
            };

            var getFilterData = function() {
                return $scope.filters;
            };

            var getFilterDataLength = function() {
                return getFilterData().length;
            };

            var getActiveFilter = function() {
                return $scope.filters.filter(function(filter){
                            return filter.active == 1;
                        }).length && $scope.filtersActive;
            };

            var getSummaryDevices = function() {
                return $scope.selectedDevicesList;
            };

            var getSummaryDevicesLength = function() {
                return getSummaryDevices().length;
            };



            var initTable = function() {

                $scope.tableParams = new NgTableParams({
                    page: 1,
                    count: 10,
                    filter: {}
                }, {
                    total: getDataLength(),
                    counts: [10,15,20,25,30],
                    getData: function($defer, params) {
                      var allData = getData(),
                          filteredData = params.filter() ? $filter('NgTableSearchFlows')(allData, params.filter(), $scope.labelCbk, $scope.getDeviceTypeById, $scope.getDeviceNameById) : allData,
                          orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;

                      params.total(orderedData.length);
                      $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    },
                    $scope: { $data: {} }

                });
            };

            var initSummaryTable = function() {
                $scope.summaryTableParams = new NgTableParams({
                    page: 1,
                    count: 10,
                    filter: {}
                }, {
                    total: getSummaryDevicesLength(),
                    counts: [10,15,20,25,30],
                    getData: function($defer, params) {
                        var allData = getSummaryDevices(),
                            filteredData = params.filter() ? $filter('FlowSummaryFilter')(allData, params.filter(), $scope.getDeviceType) : allData,
                            orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;

                        params.total(orderedData.length);
                        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    },
                    $scope: { $data: {} }
                });
            };

            var filterInitTable = function(){
                $scope.filterTableParams = new NgTableParams({
                    page: 1,
                    count: 5
                }, {
                    total: getFilterDataLength(),
                    counts: [2,5,10,15,20],
                    getData: function($defer, params) {
                        params.total(getFilterDataLength());
                        $defer.resolve(getFilterData().slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    }
                });
            };

            initSummaryTable();
            filterInitTable();
            initTable();

            $scope.$on('EV_GET_FLOWS', function() {
                $scope.tableParams.reload();
                $scope.summaryTableParams.reload();
            });

            $scope.$on('EV_GET_DEVICES', function() {
                $scope.tableParams.reload();
                $scope.summaryTableParams.reload();
            });

            $scope.$on('EV_GET_FILTERS', function() {
                $scope.clearEmptyFilters();
                $scope.filterTableParams.reload();
                $scope.tableParams.reload();
            });

            $scope.$on('EV_DELETE_FLOWS', function(event, flows) {
                $scope.deleteFlows(flows);
            });

            $scope.activateFilter = function (){
                $scope.filtersActive = !$scope.filtersActive;
                $scope.tableParams.reload();
            };

            $scope.deleteFlows = function(flows){
                var deleteFromTable = function(tableData, flows, flowToDelete) {
                        var index = flows.indexOf(flowToDelete);
                        flows.splice(index, 1);
                        $scope.tableParams.reload();
                        $scope.summaryTableParams.reload();
                    },
                    deleteFlowHandler = function(tableData, flows, flowToDelete) {
                        OpenFlowManagerUtils.deleteFlow(flowToDelete.device, flowToDelete.data.table_id, flowToDelete.data.id, function() { 
                            
                            if($scope.flowIsConfigured(flowToDelete)) {
                                setDeletingStatus(flowToDelete);
                            }
                            else {
                                deleteFromTable(tableData, flows, flowToDelete);
                            }
                            $scope.selectedFlows = [];
                        }, function(data, status) { 
                            console.info('error',data, status);
                        });
                    },
                    deleteFlowOperationalHandler = function(tableData, flows, flowToDelete) {
                        OpenFlowManagerUtils.deleteFlowOperational(flowToDelete, flowToDelete.data.table_id, flowToDelete.data.id, function() { 
                            $scope.selectedFlows = [];
                            
                            setDeletingStatus(flowToDelete);
                        }, function(data, status) { 
                            console.info('error',data, status);
                        });
                    },
                    setDeletingStatus = function(flow) {
                        flow.deleting = true;
                        $scope.deletingFlows.push(flow.data.id);
                        $scope.checkDeletingArray();
                    };

                modalWinServicesDelete.open('Delete flows', flows, $scope.labelCbk, function(){
                    if ($scope.tableParams) {
                        flows.forEach(function(flow) {
                            if($scope.onlyInOperational(flow)) {
                                deleteFlowOperationalHandler($scope.$data, $scope.flows, flow);
                            }
                            else {
                               deleteFlowHandler($scope.$data, $scope.flows, flow);
                            }
                        });
                    }
                });
            };

            $scope.editFlowFunc = function(flow){
                $scope.addEditFlow(flow);
                $scope.toggleExpanded('flowOperPopup');
            };

            $scope.refreshTable = function() {
                $scope.tableParams.reload();
                $scope.filterTableParams.reload();
                $scope.summaryTableParams.reload();
            };

            $scope.deleteFilterFromTable = function(index) {
                $scope.filters.splice(index,1);
                $scope.refreshTable();
            };

            $scope.toActivateFilter = function(index) {
                $scope.filters[index].active = $scope.filters[index].active ? 0 : 1;
                $scope.refreshTable();
            };

            $scope.summaryDevicePendingFlows = function(deviceId) {
                return $scope.flows.filter(function(f) {
                    return f && f.device == deviceId && !$scope.flowIsConfigured(f);
                });
            };

            $scope.summaryDeviceConfiguredFlows = function(deviceId) {
                return $scope.flows.filter(function(f) {
                    return f && f.device == deviceId && $scope.flowIsConfigured(f);
                });
            };

            $scope.summaryExpand = function() {
                $scope.summaryExpanded = !$scope.summaryExpanded;
                $scope.summaryTableParams.reload();
            };

//            $scope.setDeviceDeploymentMode = function(deploymentMode, deviceId) {
//                OpenFlowManagerUtils.changeDeviceDeploymentMode(deploymentMode, deviceId, function() { 
//                    $scope.loadDevices();
//                }, function() {});
//            };

//            $scope.getDeviceDeploymentMode = function(deviceId) {
//                OpenFlowManagerUtils.getDeviceDeploymentMode(deviceId, function(value) { 
//                    return value;
//                }, function() {});
//            };

        }
    ]);

    openflow_manager.register.controller('flowPropsCtrl', ['$scope', '$filter', '$timeout', 'FlowProperties', 'OpenFlowManagerUtils', 'PropertiesBuilder', 'FlowObjChecker', 
        'odlDeviceTypeHandler', 'ofTypeHandler', 'pipelineHandler', 'CommonFlowOpers', 'designUtils',
        function($scope, $filter, $timeout, FlowProperties, OpenFlowManagerUtils, PropertiesBuilder, FlowObjChecker, odlDeviceTypeHandler, ofTypeHandler, pipelineHandler,
            CommonFlowOpers, designUtils) {
            $scope.ctrl = '';
            $scope.controller_initialized = false;
            var checker = new FlowObjChecker.Checker();

            $scope.flowProps = [];
            $scope.flowMatchProps = [];
            $scope.flowActionProps = [];

            $scope.selectedFlowProps = [];
            $scope.selectedMatchProps = [];
            $scope.selectedActionProps = [];
            $scope.selFlow = null;
            $scope.errors = [];
            $scope.succesFlows = [];
            $scope.previewValue = '';
            $scope.displayIndex = 1;
            $scope.ofTypesConst = ['','of10','of13'];
            $scope.successFlowsShow = false;

            $scope.getChecker = function() {
                return checker;
            };

            $scope.setSelFlow = function(data) {
                $scope.selFlow = data;
            };

            $scope.validateSubCtrls = function() {
                $scope.controller_initialized = true;
            };

            var invalidateSubCtrls = function() {
                $scope.controller_initialized = false;
            };

            var waitUntilSubCtrlAndBroadcast = function(eventName) {
                var args = Array.prototype.slice.call(arguments, 1);
                args.unshift(eventName);

                
            };

            $scope.loadFlowPropsXml = function(xmlName, cbk) {
              PropertiesBuilder.createProperties(xmlName, function(g, m, a) {
                    $scope.flowProps = g;
                    $scope.flowMatchProps = m;
                    $scope.flowActionProps = a;
                    $scope.propWithPermVal = FlowProperties.getPropWithPermVal($scope.flowProps.concat($scope.flowMatchProps),$scope.flowActionProps);

                    if(angular.isFunction(cbk)){
                        cbk();
                    }
                }, function() {
                    $scope.propWithPermVal = FlowProperties.getPropWithPermVal($scope.flowProps,$scope.flowActionProps);
                });
            };

            $scope.selectProperties = function() {
                var old_ctrl = $scope.ctrl;
                checker.executeChecks($scope, $scope.selFlow);

                if(old_ctrl !== $scope.ctrl) {
                    invalidateSubCtrls();
                }

                var waitUntilSubCtrlInitialize = function() {
                    if($scope.controller_initialized) {
                        if($scope.selFlow) {
                            $scope.$broadcast('OF_LOAD_AND_FILL_PROPS', $scope.selFlow);
                        }
                    } else {
                        $timeout(function() {
                            waitUntilSubCtrlInitialize();
                        }, 100);
                    }
                };

                waitUntilSubCtrlInitialize();
            };

            $scope.$on('REFRESH_FILL', function(){
                if($scope.selFlow) {
                    $scope.$broadcast('OF_LOAD_AND_FILL_PROPS', $scope.selFlow);
                }
            });

            $scope.setDeviceAndSelectProperties = function(device) {
                $scope.selDevice = device;

                if(device) {
                    $scope.selectProperties();
                } else {
                    $scope.clearAndEmptyProps();
                    $scope.ctrl = '';
                }
            };



            $scope.errorFlowsSum = function() {
                return $scope.selectedFlows.filter(function(sf){
                    return sf.error.length > 0;
                }).length;
            };

            $scope.dismissFlowStatus = function() {
               $scope.selFlow.error = [];
            };

            $scope.isStatic = function(flow, prop) {
                return flow && flow.mod === 1 && prop.isType('MOD_FIXED');
            };

            $scope.isMandatory = function(prop) {
                return CommonFlowOpers.isMandatory(prop);
            };

            $scope.reloadProps = function() {
                $scope.selFlow = null;
                $scope.clearProperties();
                $scope.emptyLoadedProperties();

                CommonFlowOpers.addMandatoryProperties($scope.flowProps, $scope.selectedFlowProps);
                if($scope.selectedFlows.length === 0) {
                    $scope.appendEditFlow();
                }
            };

            $scope.$on('EV_INIT'+'flowOperPopup'.toUpperCase(), function(event) {
                $scope.reloadProps();
                $scope.displayIndex = 1;
                // $scope.duplicity = false;
            });

            $scope.clearProperties = function() {
                CommonFlowOpers.clearPropertiesGroup($scope.flowProps);
                CommonFlowOpers.clearPropertiesGroup($scope.flowMatchProps);
                CommonFlowOpers.clearPropertiesGroup($scope.flowActionProps);
            };

            $scope.emptyLoadedProperties = function() {
                $scope.selectedFlowProps = [];
                $scope.selectedMatchProps = [];
                $scope.selectedActionProps = [];
            };

            $scope.clearAndEmptyProps = function() {
                $scope.clearProperties();
                $scope.emptyLoadedProperties();
            };

            $scope.loadProps = function(xml){
                $scope.clearAndEmptyProps();
                $scope.loadFlowPropsXml(xml, function(){
                    CommonFlowOpers.addMandatoryProperties($scope.flowProps, $scope.selectedFlowProps);
                });
            };

            var checkFlowRequest = function(device, data, flowerrors) {
                var errors = [];

                if (device === null || device === undefined) {
                    errors.push('OF_DEVICE_NOT_SET');
                }

                CommonFlowOpers.clearPropertiesGroup($scope.flowProps);
                // clearPropertiesGroup($scope.flowMatchProps);

                var props = [];
                CommonFlowOpers.addProperties(data, $scope.flowProps, props);
                CommonFlowOpers.addMandatoryProperties($scope.flowProps, props);

                var mandatory = props.filter(function(p) {
                    return $scope.isMandatory(p);
                });

                if(mandatory.length) {//displayLabel
                    var isError = [];

                    mandatory.forEach(function(p) {
                        if ( p.value === null || p.value === '' ){
                            isError.push($filter('translate')(p.displayLabel));
                        }
                    });

                    if(isError.length) {
                        var errorManString = isError.join(', '),
                            descString = $filter('translate')('OF_MANDATORY_UNFILLED');
                        errors.push(descString + ': ' + errorManString);
                    }
                }

                return errors;
            };

            $scope.fillProperties = function(flowObj) {
                var actionList = [],
                    flow = flowObj.data,
                    actionPresent = flow && flow.instructions && flow.instructions.instruction &&
                                    flow.instructions.instruction.length === 1 && flow.instructions.instruction[0]['apply-actions'] && 
                                    flow.instructions.instruction[0]['apply-actions'].action && flow.instructions.instruction[0]['apply-actions'].action.length > 0,
                    device = $scope.getDeviceById(flowObj.device),
                    hasError = false;

                if(actionPresent) {
                    actionList = flow.instructions.instruction[0]['apply-actions'].action;
                }

                CommonFlowOpers.addProperties(flow, $scope.flowProps, $scope.selectedFlowProps);
                CommonFlowOpers.addProperties(flow, $scope.flowMatchProps, $scope.selectedMatchProps);
                actionList.forEach(function(data) {
                    CommonFlowOpers.addProperties(data, $scope.flowActionProps, $scope.selectedActionProps);
                });
                CommonFlowOpers.addMandatoryProperties($scope.flowProps, $scope.selectedFlowProps);

                var error = $scope.checkProperties();
                if(error) {
                    flowObj.addErrorMsg(error);
                }

                $scope.setSelFlow(flowObj);
            };

            $scope.updatePreviewValue = function(){
                $scope.previewValue = JSON.stringify(FlowProperties.createFlowRequest($scope.selectedFlowProps.concat($scope.selectedMatchProps), $scope.selectedActionProps), null, 4);
            };

            $scope.hidePreview = function(){
                $scope.view.showPreview = false;
            };

            $scope.showPreview = function(){
                $scope.updatePreviewValue();
                $scope.view.showPreview = !$scope.view.showPreview;
                designUtils.setDraggablePopups();
            };

            $scope.checkProperties = function() {
                var isError  = $scope.selectedFlowProps.concat($scope.selectedActionProps).concat($scope.selectedMatchProps).some(function(prop){
                    return prop.check() !== null && prop.error !== null;
                });
                return isError ? 'OF_PROP_FAIL' : null;
            };

            $scope.checkSelFlowOccure =  function(){
                var checkFlow = function(){
                    return $scope.selectedFlows.indexOf($scope.selFlow) !== -1;
                };

                if(!checkFlow()) {
                    $scope.setSelFlow($scope.selectedFlows[0]);
                }

                $scope.clearAndEmptyProps();
                $scope.fillProperties($scope.selFlow);
            };

            $scope.checkDuplicity = function(label){
                if((label === 'table_id' || label === 'id' || label === 'device') && $scope.selFlow){
                    var req = FlowProperties.createFlowRequest($scope.selectedFlowProps.concat($scope.selectedMatchProps), $scope.selectedActionProps),
                        device = $scope.selDevice ? $scope.selDevice.id: 0,
                        table = FlowProperties.getReqProp(req, 'table_id'),
                        id =  FlowProperties.getReqProp(req, 'id');

                    $scope.selFlow.duplicity = $scope.flows.some(function(flow){
                        return flow.device === device && flow.data.table_id.toString() === table && flow.data.id === id;
                    });
                }
            };

            $scope.createRequest = function(flowProps, flowMatchProps, actionsProps) {
                var req = FlowProperties.createFlowRequest(flowProps.concat(flowMatchProps), actionsProps),
                    valError = $scope.checkProperties();

                $scope.selFlow.data = req.flow[0];
                $scope.selFlow.error = checkFlowRequest($scope.selDevice, $scope.selFlow.data, $scope.selFlow.error);
                if(valError) {
                    $scope.selFlow.addErrorMsg(valError);
                }

                if($scope.selFlow.error.length === 0) {
                    $scope.selFlow.device = $scope.selDevice.id;
                    var device = $scope.selDevice.id,
                        tableId = FlowProperties.getReqProp(req, 'table_id'),
                        flowId =  FlowProperties.getReqProp(req, 'id'),
                        flowDataCopy = {};

                    angular.copy($scope.selFlow, flowDataCopy);

                    var setAlertCbk = function() {
                            $scope.setSuccessAlert(flowDataCopy);
                        },
                        delFlowCbk = function() {
                            $scope.deleteSelFlows($scope.selFlow);
                        };
                       
                        OpenFlowManagerUtils.sendFlow(device, tableId, flowId, req, function() { 
                            setAlertCbk();
                            delFlowCbk();
                            $scope.checkSelFlowOccure();
                        }, function(data, status) { 
                            $scope.selFlow.error = data ? data.errors.error.length ? data.errors.error.map(function(e) { return e['error-message']; }) : ['OF_UKNOWN_ERROR'] : ['OF_UKNOWN_ERROR'];
                            $scope.selFlow.error = $scope.selFlow.error.map(function(err){
                                return err.replace('\n','');
                            });
                        });
                    //}
                } 
            };

            $scope.createRequestForAll = function() {
                $scope.selFlow.data = FlowProperties.createFlowRequest($scope.selectedFlowProps.concat($scope.selectedMatchProps), $scope.selectedActionProps).flow[0];
                $scope.selFlow.device = $scope.selDevice ? $scope.selDevice.id : null;
                $scope.selFlow.error = checkFlowRequest($scope.selFlow.device, $scope.selFlow.data, $scope.selFlow.error);

                var valError = $scope.checkProperties($scope.selFlow);
                if(valError) {
                    $scope.selFlow.addErrorMsg(valError);
                }

                $scope.selectedFlows.forEach(function(flowData) {
                    if(!$scope.onlyInOperational(flowData)) {
                        flowData.error = checkFlowRequest(flowData.device, flowData.data, flowData.error);
                        if(flowData.error.length === 0) {
                            var device = flowData.device,
                                table = flowData.data.table_id,
                                flow = flowData.data.id,
                                flowDataCopy = {};

                            angular.copy(flowData, flowDataCopy);
                            
                            var setAlertCbk = function() {
                                    $scope.setSuccessAlert(flowDataCopy);
                                },
                                delFlowCbk = function() {
                                    $scope.deleteSelFlows(flowData);
                                },
                                setUpdatingStatus = function(flow) {
                                    flow.updating = true;
                                    $scope.updatingFlows.push(flow);
                                };

                                OpenFlowManagerUtils.sendFlow(device, table, flow, {flow: [flowData.data]}, function(data) { 
                                    setAlertCbk();
                                    delFlowCbk();

                                    $scope.checkSelFlowOccure();

                                }, function(data, status) {
                                    flowData.error = data ? data.errors.error.length ? data.errors.error.map(function(e) { return e['error-message']; }) : ['OF_UKNOWN_ERROR'] : ['OF_UKNOWN_ERROR'];
                                    flowData.error = flowData.error.map(function(err){
                                        return err.replace('\n','');
                                    });
                                });
                            //}
                        } 
                    } 
                });
            };

            $scope.successFlowsToggle = function() {
                $scope.successFlowsShow = !$scope.successFlowsShow;
            };

            $scope.$watch('selFlow', function(newValue, oldValue) {
                if(oldValue) {
                    oldValue.data = FlowProperties.createFlowRequest($scope.selectedFlowProps.concat($scope.selectedMatchProps), $scope.selectedActionProps).flow[0];
                    oldValue.device = $scope.selDevice ? $scope.selDevice.id : null;
                    var valError = $scope.checkProperties(oldValue);
                    if(valError) {
                        oldValue.addErrorMsg(valError);
                    }
                }

                if(newValue) {
                    $scope.clearAndEmptyProps();
                    $scope.setDeviceAndSelectProperties($scope.getDeviceById(newValue.device));
                }

                $scope.updatePreviewValue();
            });

            $scope.$watch('selDevice', function(newValue, oldValue) {
                $scope.$broadcast('OF_DEVICE_SEL', newValue);
            });

            pipelineHandler.registerCallback(checker);
            odlDeviceTypeHandler.registerCallback(checker);
            ofTypeHandler.registerCallback(checker);


            $scope.generateOptions = function(property, d) {
                if(property.displayOverride === "index") 
                {
                  return property.permValues.indexOf(d);
                }

                return d;
            };
        }
    ]);

    openflow_manager.register.controller('odlDeviceVersionCtrl', ['$scope', 'OpenFlowManagerUtils', 'CommonFlowOpers', function($scope, OpenFlowManagerUtils, CommonFlowOpers){
        var getXmlConfigName = function() {
            return $scope.selDevice.version;
        };

      $scope.$on('OF_LOAD_AND_FILL_PROPS', function(event, flowObj) {
            $scope.loadFlowPropsXml(getXmlConfigName(), function() {
                $scope.clearAndEmptyProps();
                CommonFlowOpers.addMandatoryProperties($scope.flowProps, $scope.selectedFlowProps);

                var topoNode = OpenFlowManagerUtils.getListElemByProp($scope.topologyData.nodes, 'label', $scope.selDevice.id);
                if(topoNode) {
                    CommonFlowOpers.setPermValues(topoNode.rawData, $scope.propWithPermVal);
                }
                $scope.fillProperties(flowObj);
            });
        });

        $scope.validateSubCtrls();
    }]);

    openflow_manager.register.controller('ofTypeCtrl', ['$scope', 'OpenFlowManagerUtils', 'CommonFlowOpers', function($scope, CommonFlowOpers, OpenFlowManagerUtils){
        var xmlPath = 'of13';

      $scope.$on('OF_LOAD_AND_FILL_PROPS', function(event, flowObj) {
            $scope.clearAndEmptyProps();
            $scope.loadFlowPropsXml(xmlPath, function() {
                CommonFlowOpers.addMandatoryProperties($scope.flowProps, $scope.selectedFlowProps);
                
                var topoNode = OpenFlowManagerUtils.getListElemByProp($scope.topologyData.nodes, 'label', $scope.selDevice.id);
                if(topoNode) {
                    CommonFlowOpers.setPermValues(topoNode.rawData, $scope.propWithPermVal);
                }
                $scope.fillProperties(flowObj);
            });
        });

        $scope.validateSubCtrls();
    }]);

    openflow_manager.register.controller('pipelineCtrl', ['$scope', 'pipelineHandler', 'CommonFlowOpers', 'OpenFlowManagerUtils', 
        function($scope, pipelineHandler, CommonFlowOpers, OpenFlowManagerUtils){
        $scope.deviceConfig = null;
        $scope.pipelineInfo = null;
        $scope.tableValue = null;

        var getPipelineConfigXmlName = function() {
                $scope.deviceConfig = pipelineHandler.getDeviceConfig($scope.getDeviceType($scope.selDevice));
                $scope.pipelineInfo = $scope.deviceConfig.pipelines[pipelineHandler.getPipelineNumber($scope.selDevice) - 1];
                
                return pipelineHandler.getPipelineConfigFile($scope.deviceConfig.device_code, $scope.pipelineInfo.id, $scope.tableValue ? $scope.tableValue : $scope.pipelineInfo.tables[0]);
            },
            setTablePermValues = function(tableProp){
                $scope.pipelineInfo.tables.forEach(function(table){
                    tableProp.permValues.push(table);
                });

                tableProp.setValue( $scope.tableValue ? $scope.tableValue : tableProp.permValues[0]);

                tableProp.changeValCbk = function(){
                    var tableProp = getTableProp().length ? getTableProp()[0] : null;
                    $scope.tableValue = tableProp.value;
                    $scope.$emit('REFRESH_FILL');
                };
            },
            getTableProp = function(){
                return $scope.flowProps.filter(function(i){
                            return i.displayLabel === 'OF_TABLE';
                        });
            },
            checkAndSetTableValue = function(obj){
                var data = obj.data;

                if ( data && data['table_id'] ){
                    $scope.tableValue = data['table_id'];
                }
            };

        $scope.$on('OF_LOAD_AND_FILL_PROPS', function(event, flowObj) {
            $scope.clearAndEmptyProps();
            checkAndSetTableValue(flowObj);

            $scope.loadFlowPropsXml(getPipelineConfigXmlName(), function() {
                CommonFlowOpers.addMandatoryProperties($scope.flowProps, $scope.selectedFlowProps);

                var tableProp = getTableProp().length ? getTableProp()[0] : null;
                if ( tableProp && $scope.pipelineInfo.tables && $scope.pipelineInfo.tables.length ) {
                    setTablePermValues(tableProp);
                }

                var topoNode = OpenFlowManagerUtils.getListElemByProp($scope.topologyData.nodes, 'label', $scope.selDevice.id);
                if(topoNode) {
                    CommonFlowOpers.setPermValues(topoNode.rawData, $scope.propWithPermVal);
                }
                $scope.fillProperties(flowObj);
            });
        });

        $scope.validateSubCtrls();
    }]);

    openflow_manager.register.controller('devSelectorCtrl', ['$scope', function($scope){
        $scope.$on('OF_DEVICE_SEL', function(event, device) {
            $scope.selDevice = device;
        });
    }]);


    openflow_manager.register.controller('filterPropsCtrl', ['$scope', 'FlowProperties',  'OpenFlowManagerUtils', 'PropertiesBuilder', 'CommonFlowOpers',
        function($scope, FlowProperties, OpenFlowManagerUtils, PropertiesBuilder, CommonFlowOpers) {
            $scope.flowProps = [];
            $scope.flowMatchProps = [];
            $scope.flowActionProps = [];

            $scope.selectedFlowProps = [];
            $scope.selectedMatchProps = [];
            $scope.selectedActionProps = [];

            $scope.selFlow = null;
            $scope.displayIndex = 1;

            PropertiesBuilder.createProperties('of13', function(g, m, a) {
                $scope.flowProps = g;
                $scope.flowMatchProps = m;
                $scope.flowActionProps = a;
            }, function() {});

            $scope.setSelFlow = function(data) {
                $scope.selFlow = data;
            };

            $scope.deleteFilter = function() {
                $scope.filters.splice($scope.filters.indexOf($scope.selFlow),1);
            };

            $scope.filterLabelCbk = function(filter, defaultName) {
                return filter.name;
            };

            $scope.reloadFilterProps = function() {
                if($scope.filters.length === 0) {
                    $scope.appendEditFilter();
                }
            };

            $scope.$on('EV_INIT'+'flowsFilter'.toUpperCase(), function(event) {
                $scope.reloadFilterProps();
                $scope.displayIndex = 1;
                if($scope.filters[0]){
                    $scope.selDevice = $scope.getDeviceById($scope.filters[$scope.filters.length-1].device);
                }
            });

            $scope.checkSelFilterOccure =  function(){
                var checkFlow = function(){
                    return $scope.filters.indexOf($scope.selFlow) !== -1;
                };

                $scope.setSelFlow(!checkFlow() ? $scope.filters[0] : $scope.selFlow);
            };

            $scope.fillProperties = function(flowObj) {
                var actionList = [],
                    flow = flowObj.data,
                    actionPresent = flow && flow.instructions && flow.instructions.instruction &&
                                    flow.instructions.instruction.length === 1 && flow.instructions.instruction[0]['apply-actions'] && 
                                    flow.instructions.instruction[0]['apply-actions'].action && flow.instructions.instruction[0]['apply-actions'].action.length > 0,
                    hasError = false;

                if(actionPresent) {
                    actionList = flow.instructions.instruction[0]['apply-actions'].action;
                }

                CommonFlowOpers.addProperties(flow, $scope.flowProps, $scope.selectedFlowProps);
                CommonFlowOpers.addProperties(flow, $scope.flowMatchProps, $scope.selectedMatchProps);
                actionList.forEach(function(data) {
                    CommonFlowOpers.addProperties(data, $scope.flowActionProps, $scope.selectedActionProps);
                });

                $scope.selDevice = flowObj.device ? $scope.getDeviceById(flowObj.device) : null;
                $scope.setSelFlow(flowObj);
            };

            $scope.setDeviceAndSelectProperties = function(device){
//                var topoNode = OpenFlowManagerUtils.getListElemByProp($scope.topologyData.nodes, 'label', $scope.selDevice.id);
                var topoNode = OpenFlowManagerUtils.getListElemByProp($scope.topologyData.nodes, 'label', device.id);

                $scope.selDevice = device;
                $scope.propWithPermVal = FlowProperties.getPropWithPermVal($scope.flowProps.concat($scope.flowMatchProps),$scope.flowActionProps);
                if(topoNode) {
                    CommonFlowOpers.setPermValues(topoNode.rawData, $scope.propWithPermVal);
                }
            };


            $scope.clearProperties = function() {
                CommonFlowOpers.clearPropertiesGroup($scope.flowProps);
                CommonFlowOpers.clearPropertiesGroup($scope.flowMatchProps);
                CommonFlowOpers.clearPropertiesGroup($scope.flowActionProps);
            };

            $scope.emptyLoadedProperties = function() {
                $scope.selectedFlowProps = [];
                $scope.selectedMatchProps = [];
                $scope.selectedActionProps = [];
            };

            $scope.clearAndEmptyProps = function() {
                $scope.clearProperties();
                $scope.emptyLoadedProperties();
            };

            $scope.saveCurrentFilter = function(){
                $scope.selFlow.data = FlowProperties.createFlowRequest($scope.selectedFlowProps.concat($scope.selectedMatchProps), $scope.selectedActionProps).flow[0];
                $scope.selFlow.device = $scope.selDevice ? $scope.selDevice.id : null;
            };

            $scope.saveAndExitCurrentFilter = function(){
                $scope.saveCurrentFilter();
                $scope.toggleExpanded('flowPopup');
                $scope.loadFilters();
            };

            $scope.$watch('selFlow', function(newValue, oldValue) {
                if(oldValue) {
                    oldValue.data = FlowProperties.createFlowRequest($scope.selectedFlowProps.concat($scope.selectedMatchProps), $scope.selectedActionProps).flow[0];
                    oldValue.device = $scope.selDevice ? $scope.selDevice.id : null;
                }

                if(newValue) {
                    $scope.clearAndEmptyProps();
                    $scope.fillProperties(newValue);
                }
            });

            $scope.$watch('selDevice', function(newValue, oldValue) {
                $scope.$broadcast('OF_DEVICE_SEL', newValue);
            });
        }
    ]);

    openflow_manager.register.controller('propsListCtrl', ['$scope', '$filter', 'CommonFlowOpers', function($scope, $filter, CommonFlowOpers) {
        $scope.label = '';
        $scope.propsName = '';
        $scope.selPropsName = '';
        $scope.init = function(label, propsName, selPropsName) {
            $scope.label = label;
            $scope.propsName = propsName;
            $scope.selPropsName = selPropsName;
        };

        $scope.expanded = true;
        $scope.expand = function() {
            $scope.expanded = !$scope.expanded;
        };

        $scope.getProps = function() {
            return $scope[$scope.propsName] || [];
        };

        $scope.getSelectedProps = function() {
            return $scope[$scope.selPropsName] || [];
        };

        $scope.addPropToList = function(label, props, selectedProps) {
            CommonFlowOpers.addPropToList(label, props, selectedProps);
        };
    }]);

    openflow_manager.register.controller('propDetailCtrl', ['$scope', '$filter', function($scope, $filter) {
        $scope.selPropsName = '';
        $scope.prop = null;
        $scope.deletable = false;

        $scope.init = function(prop, selPropsName, deletable) {
            $scope.prop = prop;
            $scope.selPropsName = selPropsName;
            $scope.deletable = deletable;
        };

        $scope.getSelectedProps = function() {
            return $scope[$scope.selPropsName] || [];
        };

        $scope.getPropTooltipTranslate = function(label) {
          var localeResult = $filter('translate')(label);
          return localeResult !== 'TBS' ? localeResult : '';
        };
    }]);

    openflow_manager.register.controller('deviceSelCtrl', ['$scope', '$filter', function($scope, $filter) {
    }]);

    openflow_manager.register.filter('showHideGroupedProperties', function(){
        return function(properties, selectedFlowProps){

            if(properties.length) {
                properties.filter(function(prop){
                    prop.propEnabled = selectedFlowProps.map(function(selProp){
                        return selProp.compareGroup(prop.grouping, prop.displayLabel);
                    }).indexOf(false) < 0;
                });
            }

            return properties;
        };
    });

    openflow_manager.register.filter('unique', function() {
        return function(input, key) {
            var unique = {};
            var uniqueList = [];
            if(input) {
                for(var i = 0; i < input.length; i++){
                    if(typeof unique[input[i][key]] == "undefined"){
                        unique[input[i][key]] = "";
                        uniqueList.push(input[i]);
                    }
                }
            }
            return uniqueList;
        };
    });
    
//    openflow_manager.register.controller('tagManagementCtrl', ['$scope', '$filter', 'tagUtils',
//        function($scope, $filter, tagUtils) {
//
//            $scope.searchTagTerm = '';
//            $scope.tags = [];
//            $scope.tagsOfDevices = null;
//            $scope.tagsOfLinks = null;
//            $scope.selectedTag = null;
//            $scope.showBox = false;
//            $scope.selectedDevice = null;
//            $scope.selectedLink = null;
//            $scope.tagOptions = [];
//            $scope.topologyId = null;
//            $scope.configTopology = null;
//            $scope.operationalTopology = null;
//
//            var getTags = function(tagId){
//                tagUtils.getTags(function(data){
//                    if(data){
//                        $scope.tags = data.map(function(el){
//                            var tag = tagUtils.createTag(el.id, el.description, el['tag-values']);
//                            return tag;
//                        });
//                    }
//
//                    getTagsOfDevices(tagId);
//                });
//            };
//
//            var fillTagsWithValues = function(){
//                $scope.tags = $scope.tags.map(function(el){
//                    el['values'] = $scope.configTopology.tagsFromTopology[el.id];
//
//                    return el;
//                });
//            };
//
//            var getTagsOfDevices = function(tagId){
//                tagUtils.getTagsFromTopologyNodes(function(topologyData){
//                    topologyData.getTags();
//                    $scope.configTopology = topologyData;
//                    $scope.topologyId = topologyData['topology-id'];
//                    $scope.tagsOfDevices = topologyData.tagsOfDevices;
//                    $scope.tagsOfLinks = topologyData.tagsOfLinks;
//
//                    if(tagId){
//                        $scope.configTopology.pushTagValues(tagId);
//                    }
//
//                    fillTagsWithValues();
//                    $scope.$emit('OM_LOAD_TAGS', $scope.tags);
//                });
//            };
//
//            var setBoxData = function(device, link){
//                $scope.showBox = false;
//                $scope.selectedDevice = device;
//                $scope.selectedLink = link;
//                $scope.tagOptions = loadOptions();
//                $scope.selectedTag = {'key' : null, 'value' : null};
//                $scope.showBox = true;
//            };
//
//            var loadOptions = function(){
//                return $scope.tags;
//            };
//
//            var getValueForTag = function(tag){
//                return $scope.configTopology.getValueForTag('node', $scope.selectedDevice, tag.id);
//            };
//
//            var getValueForTagForLink = function(tag){
//                return $scope.configTopology.getValueForTag('link', $scope.selectedLink, tag.id);
//            };
//
//            var getLinkIdBySrcDest = function(src, dest){
//                return $scope.operationalTopology.getLinkIdBySrcDest(src, dest);
//            };
//
//            var closeBoxes = function(){
//                $scope.showBox = false;
//                getTags();
//            };
//
//            var refreshBoxData = function(){
//                getTagsOfDevices();
//                $scope.tagOptions = loadOptions();
//            };
//
//            $scope.saveTag = function(nodeType){
//                var selDev = nodeType === 'node' ? $scope.selectedDevice : $scope.selectedLink;
//
//                $scope.configTopology.saveTag(nodeType, $scope.selectedTag, selDev, function(){
//                    getTags($scope.selectedTag.id);
//                });
//            };
//
//            $scope.changeSelectedTag = function(link){
//                $scope.selectedTag.value = link ? getValueForTagForLink($scope.selectedTag) : getValueForTag($scope.selectedTag);
//                $scope.selectedTag.values = $scope.tags.filter(function(el) {
//                     return el.id === $scope.selectedTag.id;
//                })[0]['tag-values'];
//
//                //$scope.selectedTag.values = $scope.selectedTag.values ? $scope.selectedTag.values.values : [];
//            };
//
//            $scope.hideBox = function(){
//                closeBoxes();
//                $scope.selectedDevice = null;
//                $scope.selectedLink = null;
//                $scope.selectedTag = null;
//            };
//
//            $scope.deleteValue = function(tag, nodeType){
//                var selDev = nodeType === 'node' ? $scope.selectedDevice : $scope.selectedLink;
//
//                $scope.configTopology.deleteTag(nodeType, tag, selDev);
//                $scope.configTopology.saveTag(nodeType, null, selDev, function(){
//                    getTags(tag.id);
//                });
//            };
//
//            $scope.$on('OM_SET_TAG_TO_DEVICE', function(event, device, selected) {
//                if(selected && device) {
//                    setBoxData(device, null);
//                } else {
//                    $scope.hideBox();
//                }
//            });
//
//            $scope.$on('OM_SET_TAG_TO_LINK', function(event, source, destination) {
//                if(!$scope.selectedLink || ($scope.selectedLink !== getLinkIdBySrcDest(source, destination))) {
//                    setBoxData(null, getLinkIdBySrcDest(source, destination));
//                } else {
//                    $scope.hideBox();
//                }
//            });
//
//            $scope.$on('OM_LOAD_TOPO_TAGS', function(event, operationalTopology) {
//                $scope.operationalTopology = tagUtils.getFlowOperationalTopology(operationalTopology);
//            });
//
//            getTags();
//    }]);
});


