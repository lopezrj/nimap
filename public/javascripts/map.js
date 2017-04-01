// MAPA DE MUNICIPIOS Y DEPARTAMENTOS CON BURBUJAS POR MUNICIPIO

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

var format = d3.format(",");

var q = d3.queue();
q.defer(showmap);
q.defer(createLegend);
q.await(function(error) {
  if (error) throw error;
  console.log("Goodbye!");
});

// Display municipios y departamentos
function showmap(){ 
  d3.json(mapfile, function(error, ni) {
    if (error) return console.error(error);

    // pinta los municipios as a feature
    
    map.append("path")
      .datum(topojson.feature(ni, ni.objects.departamentos))
      .attr("vector-effect","non-scaling-stroke")
      .attr("class", "land")
      .attr("d", path);

    // pinta los departamentos as a mesh
    
    map.append("path")
      .datum(topojson.mesh(ni,ni.objects.departamentos,function(a, b) { return a !== b; }))
      .attr("class", "border border--departamento")
      .attr("vector-effect","non-scaling-stroke")
      .attr("d", path); 
    
    // pinta las burbujas por municipio

    createBubbles(ni);
  });


//  createLegend();
}

// FUNCTIONS

function circleSize(d){
    return Math.sqrt( .02 * Math.abs(d) );
}

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

function createBubbles(ni){

  var arc = d3.svg.arc()  .innerRadius(0) .outerRadius(10) .startAngle(0) .endAngle(1.5*Math.PI);

  probe = d3.select("#map-container").append("div")
    .attr("id","probe");
    
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
        .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; });
    
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
}

