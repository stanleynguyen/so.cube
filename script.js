// Import CSS from Leaflet and plugins.
import 'leaflet/dist/leaflet.css';
// import 'leaflet.markercluster/dist/MarkerCluster.css';
// import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Import images directly that got missed via the CSS imports above.
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet/dist/images/marker-shadow.png';

// Import JS from Leaflet and plugins.
import 'leaflet/dist/leaflet';
// import 'leaflet.markercluster/dist/leaflet.markercluster';
// import 'leaflet.gridlayer.googlemutant/Leaflet.GoogleMutant';

import worldGeo from './data/countries.geo.json';
import mockData from './data/mock.json';

const GRADES = [20, 30, 40, 50, 60, 70, 80];

/*
  Prepping background map
*/
const mapBoxToken =
  'pk.eyJ1Ijoic3RhbmxleW5ndXllbiIsImEiOiJjamZqMHYzaTkwNDk1MnhwbXhtdXVqa3UzIn0.LkAWsagrGRbIqBGzjRjGsw';
const map = L.map('root').setView([39, 34], 2);

L.tileLayer(
  `https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=${mapBoxToken}`,
  {
    attribution:
      'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.light',
  },
).addTo(map);

/*
  Plug in map controllers
*/
const info = L.control();

info.onAdd = function(map) {
  this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
  this.update();
  return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function(props) {
  this._div.innerHTML = `<h4>Competitor Ranking</h4>${
    props
      ? props.percentile
        ? `<b>${props.name}</b><br />${props.percentile} percentile`
        : `<b>${props.name}</b><br /> Havenot competed in`
      : 'Hover over a country'
  }`;
};

info.addTo(map);

/*
  Add in legends
*/

const legend = L.control({ position: 'bottomright' });

legend.onAdd = function(map) {
  var div = L.DomUtil.create('div', 'info legend'),
    grades = GRADES,
    labels = [];

  // loop through our percentile intervals and generate a label with a colored square for each interval
  for (var i = 0; i < grades.length; i++) {
    div.innerHTML +=
      '<i style="background:' +
      getColor(grades[i] + 1) +
      '"></i> ' +
      grades[i] +
      (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
  }

  return div;
};

legend.addTo(map);

/*
  Input data into map
*/

let geoJSON;

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

function rgbToHex(r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function getColor(p) {
  // calculate gradient color based on percentile
  const r = Math.round(2.25 * p);
  const g = Math.round(2.25 * (100 - p));
  const b = 0;
  return rgbToHex(r, g, b);
}

function style(feature) {
  return {
    fillColor: getColor(feature.properties.percentile),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7,
  };
}

function joinPercentileToMap(data, mapGeo) {
  data.forEach(d => {
    const idx = mapGeo.features.findIndex(g => g.properties.name === d.country);
    if (idx > -1) mapGeo.features[idx].properties.percentile = d.percentile;
  });
  return mapGeo;
}

function highlightFeature(e) {
  const layer = e.target;

  layer.setStyle({
    weight: 5,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.7,
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }

  info.update(layer.feature.properties);
}

function resetHighlight(e) {
  geoJSON.resetStyle(e.target);
  info.update();
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature,
  });
}

geoJSON = L.geoJson(
  joinPercentileToMap(mockData[mockData.length - 1].data, worldGeo),
  {
    style,
    onEachFeature,
  },
).addTo(map);
