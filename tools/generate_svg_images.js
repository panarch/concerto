const fs = require('fs');
const path = require('path');
const process = require('process');
const Vex = require('vexflow');
const jsdom = require('jsdom').jsdom;
const xmldom = require('xmldom');
const Concerto = require('../build/concerto-node');

window = jsdom().defaultView;
document = window.document;

const filenames = fs.readdirSync('./tests').filter(
  function(filename) { return /.xml$/.test(filename); }
);
const dirExists = fs.readdirSync('./build').filter(
  function(filename) { return /^images$/.test(filename); }
).length > 0;

if (!dirExists) fs.mkdirSync('./build/images');

const element = document.createElement("div");

filenames.forEach(function(filename) {
  const data = fs.readFileSync('./tests/' + filename, 'utf8');

  const domParser = new xmldom.DOMParser();
  const doc = domParser.parseFromString(data, 'application/xml');
  const score = Concerto.parse(doc);
  const formatter = new Concerto.Formatter(score);
  formatter.format();

  const renderer = new Concerto.Renderer(score, { element });
  renderer.render();

  filename = filename.split(/.xml$/)[0];
  console.log('filename', filename);

  renderer.getContexts().forEach(function(context, i) {
    const svgData = new xmldom.XMLSerializer().serializeToString(context.svg);

    try {
      fs.writeFileSync('./build/images/' + filename + '_' + i + '.svg', svgData);
    } catch(e) {
      console.log("Can't save file: " + filename + ". Error: " + e);
      process.exit(-1);
    }
  });
});
