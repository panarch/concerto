import $ from 'jquery';
import { parse } from './Parser';
import Formatter from './Formatter';
import Renderer from './Renderer';

/*
  './examples/scales.xml',
  './examples/sonata16.xml',
  './examples/adeste.xml',
  './examples/inv4.xml',
  './examples/inv1.xml',
  './examples/test_notations.xml',
  './examples/blank_a7.xml'
  './examples/BeetAnGeSample.xml'
  './examples/ActorPreludeSample.xml'
*/

$.ajax({
  url: './examples/ActorPreludeSample.xml',
  dataType: 'text',
  success: data => {
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(data, 'application/xml');
    console.log(doc);
    const score = parse(doc);
    console.log(score);

    const formatter = new Formatter(score);
    console.log('formatter created')
    formatter.format();
    console.log(score);

    const element = document.getElementById('page');
    console.log('element', element);
    const renderer = new Renderer(score, { element });
    console.log('renderer created');
    renderer.render();
    console.log('draw complete');
  }
});
