function loaded() {
  document.getElementById('loading').style.display = 'none';
}
document.addEventListener('DOMContentLoaded', loaded, false);
window.addEventListener('load', loaded, false);

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
import {
  cData222,
  cData333,
  cData333oh,
  cData444,
  cData555,
} from './data/countries';

// ping to wake server
fetch('https://mappy-map.herokuapp.com', { mode: 'no-cors' });

let data = mockData;
let name = 'Teo Kai Xiang';
let id = '2009XIAN01';
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const COUNTRY_GRADES = [1, 2, 3, 4, 5, 6, 10, 20, 30, 40, 50];
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
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results');
const loadingOverlay = document.getElementById('loading');
const rangeSlider = document.getElementById('range-slider');
const rangeLabel = document.getElementById('range-label');
const loadingBtn = document.querySelector('.loading-btn');
const submitBtn = document.querySelector('.submit-btn');
const COMPETITOR_MODE = 'competitor',
  COUNTRY_MODE = 'country';
const CAT3 = '333',
  CAT4 = '444',
  CAT5 = '555',
  CAT3OH = '333oh',
  CAT2 = '222';
let currentCompetitor = { id, name },
  currentCategory = '333',
  currentMode = COMPETITOR_MODE;
const catSelector = document.getElementById('category-select');
const modeSelector = document.getElementById('mode-select');

/*
  Prepping background map
*/
const mapBoxToken =
  'pk.eyJ1Ijoic3RhbmxleW5ndXllbiIsImEiOiJjamZqMHYzaTkwNDk1MnhwbXhtdXVqa3UzIn0.LkAWsagrGRbIqBGzjRjGsw';
const map = L.map('root').setView([39, 34], 2);

map.attributionControl.setPrefix(
  '<a href="http://socube.surge.sh">So.Cube</a>',
);
L.tileLayer(
  `https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=${mapBoxToken}`,
  {
    attribution: `Authors: <a href="http://github.com/stanleynguyen" target="_blank">S.Nguyen</a>,
      <a href="http://github.com/kai32" targe="_blank">K.X.Teo</a>,
      <a href="http://github.com/lumotheninja" target="_blank">L.Woong</a>,
      <a href="http://github.com/vegggram" target="_blank">B.Chen</a> |
      <a href="/about.html">About This Project</a>
      <br/>
      Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,
      <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>,
      Imagery © <a href="http://mapbox.com">Mapbox</a>`,
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
  this._div.innerHTML = `<h4>${
    currentMode === COUNTRY_MODE ? 'Country Ranking' : 'Competitor Ranking'
  }</h4><hr/>
  ${
    currentMode === COUNTRY_MODE
      ? ''
      : `<b>Name:</b> ${name}<br/><b>ID:</b> ${id}<br/><br/>`
  }
  ${
    props
      ? props.percentile && props.time
        ? `<b>${props.name}</b><br />${
            props.percentile
          } percentile<br />Best timing: ${props.time / 100}s`
        : props.percentile
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
    grades = currentMode === COMPETITOR_MODE ? GRADES : COUNTRY_GRADES,
    labels = [];

  // loop through our percentile intervals and generate a label with a colored square for each interval
  for (let i = 0; i < grades.length; i++) {
    div.innerHTML += `<div class="single-legend"><i style="background:${getColor(
      grades[i],
    )}"></i> ${grades[i]}${
      grades[i + 1]
        ? grades[i + 1] - grades[i] !== 1
          ? `-${grades[i + 1] - 1}<br/>`
          : '<br/>'
        : '+'
    }</div>`;
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
  }
  if (currentMode === COMPETITOR_MODE) {
    if (p > COLORS.length) {
      return COLORS[COLORS.length - 1];
    }
    return COLORS[GRADES.indexOf(p)];
  } else if (currentMode === COUNTRY_MODE) {
    if (p < COUNTRY_GRADES[1]) {
      return COLORS[0];
    } else if (p < COUNTRY_GRADES[2]) {
      return COLORS[1];
    } else if (p < COUNTRY_GRADES[3]) {
      return COLORS[2];
    } else if (p < COUNTRY_GRADES[4]) {
      return COLORS[3];
    } else if (p < COUNTRY_GRADES[5]) {
      return COLORS[4];
    } else if (p < COUNTRY_GRADES[6]) {
      return COLORS[5];
    } else if (p < COUNTRY_GRADES[7]) {
      return COLORS[6];
    } else if (p < COUNTRY_GRADES[8]) {
      return COLORS[7];
    } else if (p < COUNTRY_GRADES[9]) {
      return COLORS[8];
    } else if (p < COUNTRY_GRADES[10]) {
      return COLORS[9];
    } else {
      return COLORS[10];
    }
  }
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
      g => g.properties.name === d.country || g.properties.id === d.country,
    );
    if (idx > -1) {
      mapGeo.features[idx].properties.percentile = d.percentile;
      if (d.time) {
        mapGeo.features[idx].properties.time = d.time;
      }
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

function changeCategory(e) {
  const oldCat = currentCategory;
  currentCategory = e.target.value;

  if (currentMode === COMPETITOR_MODE) {
    if (!currentCompetitor) return;
    retrieveCompetitionData(true)
      .then(res => {
        const midIdx = Math.floor(res.length / 2);
        data = res;
        updateMap(res[midIdx].data);
        updateSlider(res);
      })
      .catch(e => {
        currentCategory = oldCat;
        catSelector.value = currentCategory;
        alert(e.message);
      })
      .finally(() => {
        loadingOverlay.style.display = 'none';
      });
  } else if (currentMode === COUNTRY_MODE) {
    switch (currentCategory) {
      case CAT3:
        data = cData333;
        break;
      case CAT4:
        data = cData444;
        break;
      case CAT5:
        data = cData555;
        break;
      case CAT3OH:
        data = cData333oh;
        break;
      case CAT2:
        data = cData222;
        break;
      default:
        data = data;
    }
    const midIdx = Math.floor(data.length / 2);
    updateMap(data[midIdx].data);
    updateSlider(data);
  }
}

function handleModeChange(e) {
  currentMode = e.target.value;
  legend.remove();
  if (currentMode === COMPETITOR_MODE) {
    searchForm.style.display = 'block';
    currentCategory = CAT3;
    catSelector.value = CAT3;
    legend.addTo(map);
    handleResultClick(currentCompetitor);
  } else if (currentMode === COUNTRY_MODE) {
    searchForm.style.display = 'none';
    switch (currentCategory) {
      case CAT3:
        data = cData333;
        break;
      case CAT4:
        data = cData444;
        break;
      case CAT5:
        data = cData555;
        break;
      case CAT3OH:
        data = cData333oh;
        break;
      case CAT2:
        data = cData222;
        break;
      default:
        data = data;
    }
    info.update();
    legend.addTo(map);
    const midIdx = Math.floor(data.length / 2);
    updateMap(data[midIdx].data);
    updateSlider(data);
  }
}

function retrieveCompetitionData(changeCat = false) {
  const { id, name } = currentCompetitor;
  return new Promise((resolve, reject) => {
    if (!id) return reject('No ID provided');
    resultsContainer.innerHTML = '';
    loadingOverlay.style.display = 'block';
    fetch(
      `https://mappy-map.herokuapp.com/show?wcaid=${id}&puzzle=${currentCategory}`,
    )
      .then(res => {
        if (!changeCat) {
          searchInput.value = name;
        }
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
  resultsContainer.classList.add('showing');

  const listOfResultElems = document.querySelectorAll('.single-result');
  listOfResultElems.forEach((elem, idx) =>
    elem.addEventListener(
      'click',
      handleResultClick.bind(null, listOfCompetitors[idx]),
    ),
  );
}

function handleResultClick(competitor) {
  resultsContainer.classList.remove('showing');
  currentCompetitor = competitor;
  retrieveCompetitionData()
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
geoJSON = L.geoJSON(
  joinPercentileToMap(data[Math.floor(data.length / 2)].data, worldGeo),
  {
    style,
    onEachFeature,
  },
).addTo(map);

searchForm.addEventListener('submit', performSearch);
catSelector.addEventListener('change', changeCategory);
modeSelector.addEventListener('change', handleModeChange);
updateSlider(data);
