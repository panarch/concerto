module.exports = function (grunt) {
  'use strict';
  grunt.registerTask('default', [
    'jscs',
    'eslint',
    /*
    'uglify',
    'concat'
    */
    'requirejs'
  ]);

  grunt.registerTask('serve', [
    'jscs',
    'eslint',
    'connect:livereload',
    'watch'
  ]);

  grunt.registerTask('lint', [
    'jscs',
    'eslint'
  ]);
};
