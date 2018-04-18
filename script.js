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

// ping to wake server
fetch('https://mappy-map.herokuapp.com');

let data = mockData;
let name = 'Teo Kai Xiang';
let id = '2009XIAN01';
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const COLORS = [
  '#ffffcc',
  '#ffeda0',
  '#fed976',
  '#feb24c',
  '#fd8d3c',
  '#fc4e2a',
  '#e31a1c',
  '#bd0026',
  '#97001E',
  '#4B000F',
  '#000000',
];

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
  this._div.innerHTML = `<h4>Competitor Ranking</h4><hr/>
  <b>Name:</b> ${name}<br/><b>ID:</b> ${id}<br/><br/>
  ${
    props
      ? props.percentile
        ? `<b>${props.name}</b><br />${props.percentile} percentile`
        : `<b>${props.name}</b><br /> No competition information`
      : 'Hover over a country'
  }`;
};

info.addTo(map);

/*
  Add in legends
*/

const legend = L.control({ position: 'bottomright' });

legend.onAdd = function(map) {
  let div = L.DomUtil.create('div', 'info legend'),
    grades = GRADES,
    labels = [];

  // loop through our percentile intervals and generate a label with a colored square for each interval
  for (let i = 0; i < grades.length; i++) {
    div.innerHTML += `<i style="background:${getColor(grades[i])}"></i> ${
      grades[i]
    }${grades[i + 1] ? '<br>' : '+'}`;
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

  // const r = Math.round(2.25 * p);
  // const g = Math.round(2.25 * (100 - p));
  // const b = 0;
  // return rgbToHex(r, g, b);
  if (!p) {
    return 'transparent';
  } else if (p > COLORS.length) {
    return COLORS[COLORS.length - 1];
  }

  return COLORS[GRADES.indexOf(p)];
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
  mapGeo = JSON.parse(JSON.stringify(mapGeo));
  data.forEach(d => {
    const idx = mapGeo.features.findIndex(
      g => g.properties.name === d.country || g.id === d.country,
    );
    if (idx > -1) {
      mapGeo.features[idx].properties.percentile = d.percentile;
    }
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

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results');
const loadingOverlay = document.getElementById('loading');
const rangeSlider = document.getElementById('range-slider');
const rangeLabel = document.getElementById('range-label');
const loadingBtn = document.querySelector('.loading-btn');
const submitBtn = document.querySelector('.submit-btn');

function getCompetitors(term) {
  return new Promise((resolve, reject) => {
    if (!term) return resolve([]);
    fetch(`https://mappy-map.herokuapp.com/search?term=${term}`)
      .then(res => {
        if (res.status === 200) {
          res.json().then(resolve);
        } else {
          res.json().then(reject);
        }
      })
      .catch(reject);
  });
}

function retrieveCompetitionData({ id, name }) {
  return new Promise((resolve, reject) => {
    if (!id) return reject('No ID provided');
    searchInput.value = name;
    resultsContainer.innerHTML = '';
    loadingOverlay.style.display = 'block';
    fetch(`https://mappy-map.herokuapp.com/show?wcaid=${id}`)
      .then(res => {
        if (res.status === 200) {
          res.json().then(resolve);
        } else {
          res.json().then(reject);
        }
      })
      .catch(reject);
  });
}

function showSearchResults(listOfCompetitors) {
  const html = listOfCompetitors
    .map(
      c =>
        `
    <li class="single-result">
      <p class="name">${c.name}</p>
      <p class="id">${c.id}</p>
    </li>
  `,
    )
    .join('');
  resultsContainer.innerHTML = html;

  const listOfResultElems = document.querySelectorAll('.single-result');
  listOfResultElems.forEach((elem, idx) =>
    elem.addEventListener(
      'click',
      handleResultClick.bind(null, listOfCompetitors[idx]),
    ),
  );
}

function handleResultClick(competitor) {
  retrieveCompetitionData(competitor)
    .then(res => {
      const midIdx = Math.floor(res.length / 2);
      data = res;
      name = competitor.name;
      id = competitor.id;
      info.update();
      updateMap(res[midIdx].data);
      updateSlider(res);
    })
    .catch(e => {
      alert(e.message);
    })
    .finally(() => {
      loadingOverlay.style.display = 'none';
    });
}

function performSearch(e) {
  e.preventDefault();
  const term = searchInput.value;
  submitBtn.style.display = 'none';
  loadingBtn.style.display = 'block';
  getCompetitors(term)
    .then(showSearchResults)
    .catch(e => {
      alert(e.message);
    })
    .finally(() => {
      submitBtn.style.display = 'block';
      loadingBtn.style.display = 'none';
    });
}

function updateMap(data) {
  geoJSON.clearLayers();
  geoJSON = L.geoJSON(joinPercentileToMap(data, worldGeo), {
    style,
    onEachFeature,
  }).addTo(map);
}

function updateSlider(data) {
  rangeSlider.max = data.length - 1;
  rangeSlider.setAttribute('maxLabel', data[rangeSlider.max].time);
  rangeSlider.min = 0;
  rangeSlider.setAttribute('minLabel', data[rangeSlider.min].time);
  rangeSlider.value = Math.floor(data.length / 2);
  rangeSlider.addEventListener(
    'input',
    showSliderValue.bind(null, data),
    false,
  );
}

function showSliderValue(data) {
  rangeLabel.innerHTML = data[rangeSlider.value].time;
  const labelPosition = rangeSlider.value / rangeSlider.max;
  if (rangeSlider.value === rangeSlider.min) {
    rangeLabel.style.left = labelPosition * 100 + 2 + '%';
  } else if (rangeSlider.value === rangeSlider.max) {
    rangeLabel.style.left = labelPosition * 100 - 2 + '%';
  } else {
    rangeLabel.style.left = labelPosition * 100 + '%';
  }

  updateMap(data[rangeSlider.value].data);
}

// showing initial placeholder data
geoJSON = L.geoJSON(joinPercentileToMap(data[data.length - 1].data, worldGeo), {
  style,
  onEachFeature,
}).addTo(map);

searchForm.addEventListener('submit', performSearch, false);
updateSlider(data);
