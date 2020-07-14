// Create and verify API links used below
var queryUrl="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
console.log(queryUrl);
var tectUrl="https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";
console.log(tectUrl);

// Function to enlarge a maker size
function markerSize(mag) {
  return mag*4;
}
// Function to manage marker fill color
function fillColor(mag) {
  let color = "";
  if (mag >= 5) {
    color = "red";
  }
  else if (mag >= 4) {
    color = "orange";
  }
  else if (mag >= 3) {
    color = "yellow";
  }
  else if (mag >= 2) {
    color = "yellowgreen";
  }
  else if (mag >= 1) {
    color = "green";
  }
  return color;
};

d3.json(queryUrl,function(data) {
    console.log(data),
    createFeatures(data.features);
});

function createFeatures(earthquakeData) {
    var earthquakes=L.geoJson(earthquakeData, {
        pointToLayer: function(data, latlng) {
          return L.circleMarker(latlng, {
            radius: data.properties.mag * 6,
            color: fillColor(data.properties.mag),
            opacity: 0.75,
            fillOpacity: 0.75,
            weight: 0
          }).bindPopup("<h3>" + data.properties.place +
          "</h3><hr><p>" + new Date(data.properties.time) + "</p>" + "<p>" +"Magnitude: "+data.properties.mag + "</p>");
        }
    });

    // Make a function call using this GeoJSON layer to render a map below
    createMap(earthquakes);
}

// Function to render a map
function createMap(earthquakes) {
  
    // Define three different map view layers
    var grayscale = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1IjoiYWJhcnRjemFrIiwiYSI6ImNrYzE4M3ZjbTA5eXEydHBoejI5b2J3c3AifQ.F1wGX7_F5fDgXUdp5NKUyA");
  
    var satellite = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1IjoiYWJhcnRjemFrIiwiYSI6ImNrYzE4M3ZjbTA5eXEydHBoejI5b2J3c3AifQ.F1wGX7_F5fDgXUdp5NKUyA");
  
    var outdoors = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1IjoiYWJhcnRjemFrIiwiYSI6ImNrYzE4M3ZjbTA5eXEydHBoejI5b2J3c3AifQ.F1wGX7_F5fDgXUdp5NKUyA");
    
    var tectLine=new L.LayerGroup();

    d3.json(tectUrl,function(data){
        L.geoJson(data,{
                color:"orange",
                weight:2
        }).addTo(tectLine);       
    });
    
    // Define a baseMaps object to hold base layers
    var baseMaps = {
      "Satellite": satellite,
      "Grayscale": grayscale,
      "Outdoor":outdoors
    };
    
    // Create overlay object to hold overlay layer
    var overlayMaps = {
      "Earthquakes": earthquakes,
      "TectonicLine":tectLine
    };
  
    // Create the map, giving streetmap and earthquakes layers to display on load
    var myMap = L.map("mapid", {
      center: [
        37.09, -95.71
      ],
      zoom: 5,
      layers: [satellite, tectLine]
    });
  
    // Create a layer control for various constituent layes, augmennt the map with layer control
    L.control.layers(baseMaps, overlayMaps, {
      collapsed: false
    }).addTo(myMap);

    tectLine.addTo(myMap);
    
    // Create a legend to provide context for the map data
    var legend = L.control({position: 'bottomright'});
    legend.onAdd = function (myMap) {
      var div = L.DomUtil.create('div', 'info legend'),
          limits = ["0-1","1-2","2-3","3-4","4-5","5+"],
          colors = [fillColor(1),fillColor(2),fillColor(3),fillColor(4),fillColor(5),fillColor(6)],
          labels = [];

      // Add min & max
      div.innerHTML = '<div class="labels"><div class="min">' + limits[0] + '</div> \
        <div class="max">' + limits[limits.length - 1] + '</div></div>';
        
      // Define legend content
      limits.forEach(function (limit, index) {
        labels.push('<li style="background-color: ' + colors[index] + '"></li>')
      });

      // Complete the legend
      div.innerHTML += '<ul>' + labels.join('') + '</ul>';
      return div;
    }
    legend.addTo(myMap);

    d3.json(queryUrl,function(data) {
      // Setup the leaflet.timeline
      var getInterval = function(time_data) {
        return {
          start: time_data.properties.time,
          end: time_data.properties.time + time_data.properties.mag * 1800000 * 2
        };
      };

      // Create slider control 
      var sliderControl = L.timelineSliderControl({
        formatOutput: function(date) {
          return new Date(date).toString();
        },
        steps: 500
      });

      // Set the timeline of earthquake using Leaflet's timeline method
      var earthquakeTime = L.timeline(data, {
        getInterval: getInterval,
        pointToLayer: function(data, latlng) {
          return L.circleMarker(latlng, {
            radius: markerSize(data.properties.mag),
            color:fillColor(data.properties.mag),
            opacity: 0.75,
            fillOpacity: 0.75,
            weight: 0
          }).bindPopup("<h3>" + data.properties.place +
         "</h3><hr><p>" + new Date(data.properties.time) + "</p>" + "<p>" +"Magnitude: "+data.properties.mag + "</p>");
        }
      });

      // Add slider and timeline to map and a timeline control
      sliderControl.addTo(myMap);
      sliderControl.addTimelines(earthquakeTime);
      earthquakeTime.addTo(myMap);
   });
}
