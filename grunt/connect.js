// The actual grunt server settings
module.exports =  function (grunt) {
  'use strict';
  return {
    options: {
      port: grunt.option('port') || 8672,
      livereload: grunt.option('livereload') || 35729,
      // Change this to '0.0.0.0' to access the server from outside
      hostname: grunt.option('hostname') || '0.0.0.0'
    },
    livereload: {
      options: {
        open: !grunt.option('no-open'),
        base: [
          '.'
        ]
      }
    },
    dist: {
      options: {
        open: !grunt.option('no-open'),
        base: 'dist',
        livereload: false
      }
    }
  };
};
