/**
 * Created by Daniel Kuzma on 3/9/15.
 */


define(['app/openflow_manager/openflow_manager.module'], function(openflow_manager) {
  openflow_manager.register.filter('NgTableSearchFlows', function(){
    return function(allItems, terms, labelCbk, getDeviceTypeById, getDeviceNameById){
      //console.log('term', terms, allItems, labelCbk);
      var filteredData = allItems,
          dataObjFiltering = function(term, prop){
            filteredData = filteredData.filter(function(i){
              return i.data[prop].toString().toLocaleLowerCase().indexOf(term) !== -1;
            });
          },
          objFunc = {
            'flow-name': function(term){
              filteredData = filteredData.filter(function(i){
                return labelCbk(i).toLocaleLowerCase().indexOf(term) !== -1;
              });
            },
            'device': function(term){
              filteredData = filteredData.filter(function(i){
                return i.device.toLocaleLowerCase().indexOf(term) !== -1;
              });
            },
            id: function(term, prop){
              dataObjFiltering(term, prop);
            },
            'table_id': function(term, prop){
              dataObjFiltering(term, prop);
            },
            'device-type': function(term){
              filteredData = filteredData.filter(function(i){
                  return getDeviceTypeById(i.device).toLocaleLowerCase().indexOf(term) !== -1;
              });
            },
            'device-name': function(term){
              filteredData = filteredData.filter(function(i){
                  return getDeviceNameById(i.device).toLocaleLowerCase().indexOf(term) !== -1;
              });
            }
          };

      for ( var prop in terms ) {
        objFunc[prop](terms[prop].toLocaleLowerCase(), prop);
      }
      return filteredData;
    };
  });

    openflow_manager.register.filter('FlowSummaryFilter', function(){
        return function(allItems, terms, getDeviceType){
          
          var filteredData = allItems,
              dataObjFiltering = function(term, prop){
                  filteredData = filteredData.filter(function(i){
                      return i[prop].toString().toLocaleLowerCase().indexOf(term) !== -1;
                  });
              },
              objFunc = {
                  id: function(term, prop){
                      dataObjFiltering(term, prop);
                  },
                  'device-type': function(term){
                      filteredData = filteredData.filter(function(i){
                          return getDeviceType(i).toLocaleLowerCase().indexOf(term) !== -1;
                      });
                  }
              };

          for ( var prop in terms ) {
            objFunc[prop](terms[prop].toLocaleLowerCase(), prop);
          }
          return filteredData;
        };
  });
});

