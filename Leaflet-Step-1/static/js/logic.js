// Create and verify API link selected from the referenced website https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
var queryUrl ="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"
console.log(queryUrl);

// Function to enlarge a maker size
function markerSize(mag) {
  return mag*4;
}
// Function to manage marker fill color
function fillColor(mag) {
  let color = "";
  if (mag >= 5) {
    color = '#FF0000';
  }
  else if (mag >= 4) {
    color = '#FFA500';
  }
  else if (mag >= 3) {
    color = 'FFFF00';
  }
  else if (mag >= 2) {
    color = '#9ACD32';
  }
  else if (mag >= 1) {
    color = '#00FF00';
  }
  else {
    color = '#90EE90';
  }
  return color;
};

// Pull the GeoJSON earthquake data from the referenced link
d3.json(queryUrl, function (data) {
  console.log(data),
  createFeatures(data);
});

// Function to create a GeoJSON map layer containing features of the GeoJSON earthquake data
function createFeatures(earthquakeData) {

  // Local function to return markers with dynamically applied settings for each element
  function onEachLayer(feature) {
    return new L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
      { radius: markerSize(feature.properties.mag),
        fillColor: fillColor(feature.properties.mag),
        fillOpacity: 0.5,
        stroke: false,
      });
  }
 
  // Local function to create the time and place popup description for each selected map feature
  function onEachFeature(feature, layer) {
    layer.bindPopup("<h1>" + feature.properties.place + "</h1><hr><p>" + new Date(feature.properties.time) +
      "</p><hr><p>" + feature.properties.mag + "</p>");
  }

  // Create a GeoJSON layer with all features defined above
  var earthquakes = L.geoJson(earthquakeData, {
    onEachFeature: onEachFeature,
    pointToLayer: onEachLayer
  });

  // Make a function call using this GeoJSON layer to render a map below
  createMap(earthquakes);
}

// Function to render a map
function createMap(earthquakes) {

  // Define outdoors map base layer
  var outdoors = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
  "access_token=pk.eyJ1IjoiYWJhcnRjemFrIiwiYSI6ImNrYzE4M3ZjbTA5eXEydHBoejI5b2J3c3AifQ.F1wGX7_F5fDgXUdp5NKUyA");

  // Create a baseMaps layer object to hold the two base layers above
  var baseMaps = {
    "Outdoor": outdoors
  };

  // Create overlayMaps layer object to hold GeoJSON map overlay layer
  var overlayMaps = {
    "Earthquakes": earthquakes
  };

  // Create a map with outdoors map and earthquakes layers displayed by default
  var myMap = L.map("map", {
    center: [37.7749, -122.4194],
    zoom: 10,
    layers: [outdoors, earthquakes]
  });

  // Create a legend to provide context for the map data
  var legend = L.control({position: 'bottomright'});
  legend.onAdd = function (myMap) {
  var div = L.DomUtil.create("div", "legend");
      div.innerHTML += "<h4><strong>Color Legend</strong></h4>";
      div.innerHTML += '<i style="background: #90EE90"></i><span>0-1</span><br>';
      div.innerHTML += '<i style="background: #00FF00"></i><span>1-2</span><br>';
      div.innerHTML += '<i style="background: #9acd32 "></i><span>2-3</span><br>';
      div.innerHTML += '<i style="background: #FFFF00"></i><span>3-4</span><br>';
      div.innerHTML += '<i style="background: #FFA500"></i><span>4-5</span><br>';
      div.innerHTML += '<i style="background: #FF0000"></i><span>5+</span><br>';
      return div;
  };

  legend.addTo(myMap);
}