var dateScale, sliderScale, slider;

var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    months_full = ["January","February","March","April","May","June","July","August","September","October","November","December"],
    orderedColumns = [],
    currentFrame = 0,
    interval,
    frameLength = 500,
    isPlaying = false;

var sliderMargin = 65;

   
d3.json(mapfile, function(error, ni) {
  if (error) return console.error(error);

  d3.select("body")
    .append("div")
    .attr("id","loader")
    .style("top",d3.select("#play").node().offsetTop + "px")
    .style("height",d3.select("#date").node().offsetHeight + d3.select("#map-container").node().offsetHeight + "px")
  
});

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

