module.exports = function (grunt) {
  'use strict';
  return {
    ignore_warnings: {
      options: {
        '-W069': true
      },
      src: [
        '<%= data.files %>',
        'schema/musicjson.json'
      ]
    }
  };
};
