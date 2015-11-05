define(['app/openflow_manager/openflow_manager.module'], function(openflow_manager) {
   
  openflow_manager.register.directive('ofstats', ['$parse', function ($parse) {
    var ofstatsDirective = {
          restrict: 'E',
          replace: false,
          scope: {
              data: '=',
              objs: '='
          },
          link: function (scope, element, attrs) {
              console.info('got data', scope.data);

              var margin = {top: 20, right: 20, bottom: 30, left: 50},
                  width = 960 - margin.left - margin.right,
                  height = 500 - margin.top - margin.bottom;

              var color = d3.scale.category20();

              var x = d3.scale.linear()
                  .range([0, width]);

              var y = d3.scale.linear()
                  .range([height, 0]);

              var xAxis = d3.svg.axis()
                  .scale(x)
                  .orient("bottom");

              var yAxis = d3.svg.axis()
                  .scale(y)
                  .orient("left");

              var area = d3.svg.area()
                  .x(function(d) { return x(d.time); })
                  .y0(function(d) { return y(d.y0); })
                  .y1(function(d) { return y(d.y0 + d.y); });

              var stack = d3.layout.stack()
                .values(function(d) { console.log('stack is', d); return d.values; })
                .x(function (d) { return x(d.time); })
                .y(function (d) { return d.value; })
                ;

              var svg = d3.select("div").append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

              var update = function(inobjs, indata) {
                  var objs = Object.keys(inobjs) || [];

                  color.domain(objs);

                  console.log(color.range(), inobjs, objs);

                  var stackStatData = stack(objs.map(function(name) {
                        // var nameindex = devices[name];
                        return {
                          name: name,
                          values: indata.map(function(d) {
                            console.log(d,'time is',d.time,'value for',name,'is',d.values[name] || 0);
                            return {time: d.time, value: (d.values[name] || 0)};
                          })
                        };
                      }));

                  var statData = svg.selectAll('.stackStatData')
                      .data(stackStatData)
                    .enter().append("g")
                      .attr("class", "stackStatData");

                  var sumValues = function(values) {
                      var ret = 0;
                      for(var p in values) {
                          ret += values[p];
                      }
                      return ret;
                  };

                  x.domain(d3.extent(indata, function(d) { return d.time; }));
                  y.domain([0, d3.max(indata, function(d) { return sumValues(d.values); })]);

                  svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                  svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis);

                  statData.append("path")
                      .attr("class", "area")
                      .attr("d", function(d) { console.log('d is',d); return area(d.values); })
                      .style("fill", function(d) { console.log('fill d is',d); return color(d.name); });
              };

              scope.$watch('data', function() {
                  console.log('updating with',scope.objs, scope.data);
                  update(scope.objs, scope.data);
              });
         }
      };
      return ofstatsDirective;
   }]);
});