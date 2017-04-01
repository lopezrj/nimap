
var mapfile=  "/geodata/ni.json";
var datafile=  "/data/poblacion.tsv";

var width = 1260,
    height = 800;

var projection = d3.geo.mercator().center([-85.9,13.65])
    .scale(10000);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#map-container").append("svg")
    .attr("width", width)
    .attr("height", height);
    
var g = svg.append("g");

g.append( "rect" )
  .attr("width",width)
  .attr("height",height)
  .attr("fill","white")
  .attr("opacity",0)
  .on("mouseover",function(){
    hoverData = null;
    if ( probe ) probe.style("display","none");
  })

var map = g.append("g")
    .attr("id","map");
    
var radius = d3.scale.sqrt()
    .domain([0, 1e6])
    .range([0, 50]);

var probe,
    hoverData;

var dateScale, sliderScale, slider;

var format = d3.format(",");

var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    months_full = ["January","February","March","April","May","June","July","August","September","October","November","December"],
    orderedColumns = [],
    currentFrame = 0,
    interval,
    frameLength = 500,
    isPlaying = false;

var sliderMargin = 65;

function circleSize(d){
  return Math.sqrt( .02 * Math.abs(d) );
};

var arc = d3.svg.arc()  .innerRadius(0) .outerRadius(10) .startAngle(0) .endAngle(1.5*Math.PI);
   
d3.json(mapfile, function(error, ni) {
  if (error) return console.error(error);
  
  map.append("path")
    .datum(topojson.feature(ni, ni.objects.departamentos))
    .attr("vector-effect","non-scaling-stroke")
    .attr("class", "land")
    .attr("d", path);
  
  map.append("path")
    .datum(topojson.mesh(ni,ni.objects.departamentos,function(a, b) { return a !== b; }))
    .attr("class", "border border--departamento")
    .attr("vector-effect","non-scaling-stroke")
    .attr("d", path);

  probe = d3.select("#map-container").append("div")
    .attr("id","probe");
    
  d3.select("body")
    .append("div")
    .attr("id","loader")
    .style("top",d3.select("#play").node().offsetTop + "px")
    .style("height",d3.select("#date").node().offsetHeight + d3.select("#map-container").node().offsetHeight + "px")
  
  d3.tsv(datafile, function(d) { 
    pobById = d3.map();
    pctUrbana = d3.map();
    pobUrbana = d3.map();
    d.forEach(function(d) {
      pobById.set(d.id, +d.pob2012);
      pctUrbana.set(d.id, +d.pob2012ur/+d.pob2012);
      pobUrbana.set(d.id, +d.pob2012ur);
    });
    
        map.append("g")
          .attr("class", "arcs")
          .selectAll(".arc")
            .data(topojson.feature(ni, ni.objects.municipios).features
                  .sort(function(a,b) { return pobById.get(b.id) - pobById.get(a.id)}))
            .enter().append("path")
            .attr("class","arc")
            .attr("d", arc
                       .outerRadius(function(d) { return radius(pobById.get(d.id)); })
                       .endAngle(function(d) { return 2*Math.PI*pctUrbana.get(d.id); })
                  )
            .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
    ;
    
    
    map.append("g")
      .attr("class", "bubble")
      .selectAll("circle")
        .data(topojson.feature(ni, ni.objects.municipios).features
              .sort(function(a,b) { return pobById.get(b.id) - pobById.get(a.id)}))
        .enter().append("circle")
        .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
        .attr("r", function(d) { return radius(pobById.get(d.id)); })
    .on("mousemove",function(d){
           hoverData = d.name;
           setProbeContent(d);
           probe
             .style( {
               "display" : "block",
               "top" : (d3.event.pageY - 80) + "px",
               "left" : (d3.event.pageX + 10) + "px"
             })
         })
         .on("mouseout",function(){
           hoverData = null;
           probe.style("display","none");
         });



  
    })

  createLegend();
  
//  createSlider();
    
  
});


function createLegend() {
  
  var legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(" + (150) + "," + (height - 150) + ")")
    .selectAll("g")
      .data([5e4, 1.5e5, 3e5,1e6 ])
    .enter().append("g");
    
  legend.append("circle")
    .attr("cy", function(d) { return -radius(d); })
    .attr("r", radius);

  legend.append("text")
    .attr("y", function(d) { return -2 * radius(d); })
    .attr("dy", "1.3em")
    .text(d3.format(".1s"));
}



function createSlider(){
  slider = d3.slider()
            .axis(true)
            .min(1960)
            .max(2005);

  d3.select("#slider-div").remove();

  d3.select("#slider-container")
    .append("div")
    .attr("id","slider-div")
    .style("width", "200px")
  .call( slider);
}

function createSlider2(){

  sliderScale = d3.scale.linear().domain([0,orderedColumns.length-1]);

  var val = slider ? slider.value() : 0;

  slider = d3.slider()
    .scale( sliderScale )
    .on("slide",function(event,value){
      if ( isPlaying ){
        clearInterval(interval);
      }
      currentFrame = value;
//      drawMonth( orderedColumns[value], d3.event.type != "drag" );
    })
    .on("slideend",function(){
      if ( isPlaying ) animate();
      d3.select("#slider-div").on("mousemove",sliderProbe)
    })
    .on("slidestart",function(){
      d3.select("#slider-div").on("mousemove",null)
    })
    .value(val);

    d3.select("#slider-div").remove();

    d3.select("#slider-container")
      .append("div")
      .attr("id","slider-div")
      .style("width",dateScale.range()[1] + "px")
      // .on("mousemove",sliderProbe)
      // .on("mouseout",function(){
      //   d3.select("#slider-probe").style("display","none");
      // })
      .call( slider );

    d3.select("#slider-div a").on("mousemove",function(){
      d3.event.stopPropagation();
    })

  

}

function setProbeContent(d){
//  var val = d[ orderedColumns[ currentFrame ] ],
//      m_y = getMonthYear( orderedColumns[ currentFrame ] ),
//      month = months_full[ months.indexOf(m_y[0]) ];
//  var html = "<strong>" + d.CITY + "</strong><br/>" +
//            format( Math.abs( val ) ) + "  " + ( val < 0 ? "lost" : " count" ) + "<br/>" +
//            "<span>" + month + " " + m_y[1] + "</span>";
  var html= "<strong>" + d.properties.name + "</strong><br/>"
            + "Hab: " + d3.format(",d")(pobById.get(d.id)) 
            + "<br/> Urbano: " + d3.format("%")(pctUrbana.get(d.id))
            + " " + d3.format(",d")(pobUrbana.get(d.id));
  probe
    .html( html );
}

function createDateScale( columns ){
  var start = getMonthYear( columns[0] ),
      end = getMonthYear( columns[ columns.length-1 ] );
  return d3.time.scale()
    .domain( [ new Date( start[1], months.indexOf( start[0] ) ), new Date( end[1], months.indexOf( end[0] ) ) ] );


}


function getMonthYear(column){
  var m_y = column.split("-");
  var year = parseInt( m_y[1] );
  if ( year > 90 ) year += 1900;
  else year += 2000;
  return [ m_y[0], year ];
}

function monthLabel( m ){
  var m_y = getMonthYear(m);
  return "<span>" + m_y[0].toUpperCase() + "</span> " + m_y[1];
}

