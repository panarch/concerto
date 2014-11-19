module.exports = function (grunt) {
  return {
    options: {
      stripBanners: false,
      banner: '/*! <%= data.pkg.name %> - v<%= data.pkg.version %> | ' +
        '<%= grunt.template.today("yyyy-mm-dd") %> | ' +
        '(c) Taehoon Moon 2014, <%= grunt.template.today("yyyy") %> | ' +
        'https://raw.github.com/panarch/concerto/master/LICENSE */\n'
    },
    dist: {
      src: [
        'build/concerto-min.js'
      ],
      dest: 'build/concerto-min.js'
    },
    module: {
      options: {
        stripBanners: false,
        banner: 'define(function(require, exports, module) {\n' +
          'var $ = require("jquery");\n' +
          'var Vex = require("concerto/vexflow");\n',
        footer: '\nmodule.exports = Concerto;\n});'
      },
      src: [
        'build/concerto-min.js'
      ],
      dest: 'build/module/concerto.js'
    },
    vexflow: {
      options: {
        stripBanners: false,
        banner: 'define(function(require, exports, module) {\n' +
          'var $ = require("jquery");\n' +
          'var Raphael = require("raphael");\n',
          footer: '\nmodule.exports = Vex;\n});'
      },
      src: [
        'bower_components/vexflow/build/vexflow/vexflow-min.js'
      ],
      dest: 'build/module/vexflow.js'
    }
  };
};
