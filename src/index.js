import $ from 'jquery';
import { parse } from './Parser';

$.ajax({
  url: './examples/sonata16.xml',
  dataType: 'text',
  success: data => {
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(data, 'application/xml');
    console.log(doc);
    const score = parse(doc);
    console.log(score);
  }
});
