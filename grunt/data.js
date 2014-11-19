module.exports = function (grunt) {
  return {
    pkg: grunt.file.readJSON('package.json'),
    files: [
      'src/concerto.js',
      'src/table.js',
      'src/parser.js',
      'src/attributesmanager.js',
      'src/layoutmanager.js',
      'src/notemanager.js',
      'src/measuremanager.js',
      'src/barlinemanager.js',
      'src/renderer.js',
      'src/converter.js'
    ]
  };
};
