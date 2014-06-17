module.exports = function(grunt) {
  var files = [
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
  ];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      ignore_warning: {
        options: {
          '-W069': true
        },
        src: files.concat('schema/musicjson.json')
      }
    },
    uglify: {
       options: {
        mangle: false
      },
      my_target: {
        files: {
          'build/concerto-min.js': files
        }
      }
    },
    concat: {
      options: {
        stripBanners: false,
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> | ' +
          '<%= grunt.template.today("yyyy-mm-dd") %> | ' +
          '(c) Taehoon Moon 2014, <%= grunt.template.today("yyyy") %> | ' +
          'https://raw.github.com/panarch/concerto/master/LICENSE */\n',
      },
      dist: {
        src: [
          'build/concerto-min.js'
        ],
        dest: 'build/concerto-min.js',
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['jshint', 'uglify', 'concat']);
};
