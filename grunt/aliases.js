module.exports = function (grunt) {
  'use strict';
  grunt.registerTask('default', [
    'jscs',
    'eslint',
    'uglify',
    'concat'
  ]);

  grunt.registerTask('lint', [
    'jscs',
    'eslint'
  ]);
};
