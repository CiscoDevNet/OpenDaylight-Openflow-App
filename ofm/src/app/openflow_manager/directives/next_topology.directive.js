var modules = [
  'app/openflow_manager/openflow_manager.module',
  'next',
  'next-topology'
];


var transformTopologyData = function(topology, showHost) {
    var nodes = topology.nodes.filter(function(node) {
            return showHost ? true : node.label.indexOf('host') !== 0;
        }),
        nodeIDs = nodes.map(function(node) {
            return node.id;
        });

    var links = topology.links.filter(function(link) {
        return link !== undefined && link !== null && 
               link.hasOwnProperty('from') && link.hasOwnProperty('to') &&
               nodeIDs.indexOf(link.from) !== -1 && nodeIDs.indexOf(link.to) !== -1;
    }).map(function(link) {
        return {source: parseInt(link.from), target: parseInt(link.to)};
    });

    return {nodes: nodes, links: links};
};

define(modules, function(openflow_manager) {

  openflow_manager.register.directive('nextTopology', function() {
    return {
      restrict: 'E',
      scope: {
          topologyData: '=',
          nodeClickCallback: '=',
          customFunctions: '=',
          showHostDevice: '=',
          topo: '='
      },
      template: '<div id="graph-container" class="col-md-12"></div>',
      link: function($scope, iElm, iAttrs, controller) {

          var nodeClickCallback = $scope.nodeClickCallback || function() { console.warn('nextTopology directive:node click callback is not specified'); };
          var topoInitialized = false;
          var topo = null;

          var topoColors = {
            switch : '#449dd7',
            host: '#464646'
          };

          nx.define('CustomEvents', nx.graphic.Topology.DefaultScene, {
              methods: {
                  clickNode: function(sender, node, event) {
                      //var selected = nodeClickCallback(node.get('label'));
                      //
                      //node.set('selected', selected);
                      //node.color(selected ? '#b9dce6' : topoColors[node._iconType]);
                      //
                      //$scope.customFunctions.setStatisticsDevice(node._label, selected);

                      // console.log('event', sender);

                  },

                  //clickLinkSetNumber: function(sender, link){
                  //    console.log('Next: click link set', sender, link);
                  //    link.collapsedRule(false);
                  //    link.updateLinkSet();
                  //},
                  // enterNode: function(sender, node) {
                  //     this.inherited(sender, node);
                  //     console.log(node.getLinks());
                  // },
                  // enterLink: function(sender, link) {
                  //     this.inherited(sender, link);
                  //     link.color('#f00');
                  // },
                  //clickLink: function(sender, link) {
                  //    console.log('Next: click edge', sender, link);
                  //},
                  //enterLink: function(sender, link){
                  //    console.log('Next: enter edge', sender, link);
                  //}
                  // leaveLink: function(sender, link) {
                  //     this.inherited(sender, link);
                  //     link.color(null);
                  // }
              }

          });

          var initTopology = function(nodes, links) {
              var topologyData = {nodes: nodes, links: links};

              topo = new nx.graphic.Topology({
                  adaptive: true,
                  // scalable: true,
                  nodeConfig: {
                      label: 'model.label',
                      iconType: 'model.group',
                      color: function(node, model) {
                        return topoColors[model._iconType];
                      }
                  },
                  linkConfig: {
                    color: function(link, model) {
                      var isHost = link._linkKey.split('_').some(function(n){
                                      return $scope.topologyData.nodes.some(function(tn){
                                              return tn.id === n && tn.group === 'host';
                                            });
                                    });

                      return isHost ? topoColors['host'] : topoColors['switch'];
                    },
                    linkType: 'curve'
                  },
                  dataProcessor: 'force',
                  identityKey: 'id',
                  // height: 600,
                  // width: 600,
                  showIcon: true,
                  theme: 'blue',
                  enableSmartNode: false,
                  tooltipManagerConfig: {
                        nodeTooltipContentClass: 'CustomTooltip'
                    }
              });

              topo.tooltipManager().showNodeTooltip(false);
              topo.tooltipManager().showLinkSetTooltip(false);

              topo.on('topologyGenerated', function(sender, event) {
                  //sender.registerScene("ce", "CustomEvents");
                  //sender.activateScene('ce');

                  topo.on('mouseup', function(sender, event) {
                      var target = event.target,
                          nodesLayerDom = topo.getLayer('nodes').dom().$dom,
                          linksLayerDom = topo.getLayer('links').dom().$dom,
                          selectNode = function(node){
                              var selected = nodeClickCallback(node.get('label'));
                              node.set('selected', selected);
                              node.color(selected ? '#b9dce6' : topoColors[node._iconType]);
                              return selected;
                          },
                          nodeEvent = {
                              event1 : function(node){
                                  $scope.customFunctions.setStatisticsDevice(node._label, selectNode(node));
                              },
                              event3 : function(node) {
                                  $scope.customFunctions.setTagToDevice(node._label, selectNode(node));
                              }
                          },
                          linkEvent = {
                              event3 : function(link){
                                  $scope.customFunctions.setTagToLink(link);
                              }
                          },
                          getLinkNodeId = function(type){
                              while (!target.classList.contains(type)) {
                                  target = target.parentElement;
                              }
                              return target.getAttribute('data-id');
                          };

                      // console.log('event.which', event.which, nodesLayerDom);
                      if (nodesLayerDom.contains(target)) {
                          // console.log('event.which', event.which, 'in');
                          var node = topo.getNode(getLinkNodeId('node'));

                          if ( nodeEvent['event' + event.which] ) {
                              nodeEvent['event' + event.which](node);
                          }

                          return;
                      }


                      if (linksLayerDom.contains(target)) {
                          var link = topo.getLink(getLinkNodeId('link'));

                          if ( linkEvent['event' + event.which] ) {
                              linkEvent['event' + event.which](link);
                          }

                          return;
                      }
                  });

              });

              topo.on('ready', function(sender, event) {
                 topo.data(topologyData);

                 collapseLinks(topo);
              }); 

              var app = new nx.ui.Application();
              app.container(document.getElementById('graph-container'));
              app.on('resize', function(){
                // console.log('adapting via resize');
                // main.resolve('topo').adaptToContainer();
                  topo.adaptToContainer();
              });

              topo.attach(app);
              $scope.topo = topo;
              topoInitialized = true;
          };

          $scope.$watch('topologyData', function() {
              if($scope.topologyData.nodes.length && topoInitialized === false) {
                  var data = transformTopologyData($scope.topologyData);
                  initTopology(data.nodes, data.links);

                  collapseLinks($scope.topo);
              }
          });

          $scope.$watch('showHostDevice', function(){
            if($scope.topologyData.nodes.length) {
              var data = transformTopologyData($scope.topologyData, $scope.showHostDevice);
              topo.data(data);

              collapseLinks($scope.topo);
            }
          });

          var collapseLinks = function(topoToCollapse){
              topoToCollapse.getLayer('linkSet').eachLinkSet(function(l){
                  l.collapsedRule(true);
                  l.updateLinkSet();
              });
          };
      }
    };
  });
});
