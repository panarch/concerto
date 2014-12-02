module.exports =  {
  compile: {
    options: {
      optimize: 'none',
      uglify2: {
        mangler: {
          toplevel: false,
          beautify: false 
        }
      },
      baseUrl: 'src',
      mainConfigFile: 'src/requireConfig.js',
      name: 'almond',
      include: 'Concerto',
      cjsTranslate: true,
      //insertRequire: ['Concerto'],
      wrapShim: true,
      out: 'dist/concerto-min.js',
      wrap: {
          startFile: 'wraps/start.frag.js',
          endFile: 'wraps/end.frag.js'
      }
    }
  }
};
