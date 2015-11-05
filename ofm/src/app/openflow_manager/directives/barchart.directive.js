define(['app/openflow_manager/openflow_manager.module'], function(openflow_manager) {
   
  openflow_manager.register.directive('ofstats', [ '$parse', function ($parse) {
    var ofstatsDirective = {
          restrict: 'E',
          replace: false,
          scope: {
              data: '=',
              dataType: '='
          },
          link: function (scope, element, attrs) {
              var margin = {top: 20, right: 20, bottom: 30, left: 40},
                  width = 960 - margin.left - margin.right,
                  height = 500 - margin.top - margin.bottom;

              var x = d3.scale.ordinal()
                  .rangeRoundBands([0, width], 0.1);

              var y = d3.scale.linear()
                  .range([height, 0]);

              var xAxis = d3.svg.axis()
                  .scale(x)
                  .orient("bottom");

              var yAxis = d3.svg.axis()
                  .scale(y)
                  .orient("left");

              var svg = d3.select('ofstats').append("svg");


              var update = function(data) {
                svg
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                x.domain(data.map(function(d) { return d.label; }));
                y.domain([0, d3.max(data, function(d) { return d.value; })]);

                  svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                  svg.append("g")
                      .attr("class", "y axis")
                      .call(yAxis)
                    .append("text")
                      .attr("transform", "rotate(-90)")
                      .attr("y", 6)
                      .attr("dy", ".71em")
                      .style("text-anchor", "end")
                      .text(scope.dataType);


                var graph = svg.selectAll(".bar")
                    .data(data)
                  .enter().append("rect")
                    .attr("class", "bar")
                    .attr("width", x.rangeBand())
                    .attr("height", function(d) { return height - y(d.value); })
                    .attr("x", function(d) { return x(d.label); })
                    .attr("y", function(d) { return y(d.value); });
              };

              scope.$watch('data', function() {
                  update(scope.data);
              });
         }
      };
      return ofstatsDirective;
   }]);
});