import { GoogleCharts } from 'google-charts';

GoogleCharts.load(draw, 'geochart');

function draw() {
  var data = GoogleCharts.api.visualization.arrayToDataTable([
    ['Country', 'Popularity'],
    ['Germany', 200],
    ['United States', 300],
    ['Brazil', 400],
    ['Canada', 500],
    ['France', 600],
    ['RU', 700],
  ]);
  const alterData = GoogleCharts.api.visualization.arrayToDataTable([
    ['Country', 'Popularity'],
    ['Germany', 200],
    ['United States', 3000],
    ['Brazil', 400],
    ['Canada', 500],
    ['France', 600],
    ['RU', 7],
  ]);

  const options = {
    animation: {
      duration: 10000,
      easing: 'out',
    },
  };

  var chart = new GoogleCharts.api.visualization.GeoChart(
    document.getElementById('root'),
  );

  chart.draw(data, options);
  setTimeout(chart.draw.bind(chart, alterData, options), 5000);
}
