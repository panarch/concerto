const fs = require('fs');
const Concerto = require('../build/concerto');
const path = './build/images';
const element = document.createElement('div');
const filenames = fs.list('./tests').filter(
  function(filename) { return /.xml$/.test(filename); }
);

fs.makeDirectory(path);
filenames.forEach(function(filename) {
  const data = fs.read('./tests/' + filename);
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(data, 'application/xml');
  const score = Concerto.parse(doc);
  const formatter = new Concerto.Formatter(score);
  formatter.format();

  const renderer = new Concerto.Renderer(score, { element });
  renderer.render();

  filename = filename.split(/.xml$/)[0];
  console.log(filename);

  renderer.getContexts().forEach(function(context, i) {
    const svgData = new XMLSerializer().serializeToString(context.svg);
    fs.write(path + '/' + filename + '_' + i + '.svg', svgData, 'w');
  });
});

slimer.exit();
