import { GoogleCharts } from 'google-charts';

import mockData from './data/mock.json';

GoogleCharts.load(draw, 'geochart');

function draw() {
  let i = 0;
  const options = {
    animation: {
      duration: 10000,
      easing: 'out',
    },
    colorAxis: {
      minValue: 1,
      maxValue: 100,
      colors: ['#ff0000', '#00ff00'],
    },
    magnifyingGlass: { enable: false, zoomFactor: 5.0 },
  };
  var chart = new GoogleCharts.api.visualization.GeoChart(
    document.getElementById('root'),
  );
  // setInterval(() => {
  const data = mockData[i].data.map(d => [d.country, 100 - d.percentile]);

  var chartData = GoogleCharts.api.visualization.arrayToDataTable([
    ['Country', 'Percentile'],
    ...data,
  ]);

  chart.draw(chartData, options);
  if (i < mockData.length - 2) {
    i++;
  } else {
    i--;
  }
  // }, 100);
}
