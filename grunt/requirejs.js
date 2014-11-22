module.exports =  {
  compile: {
    options: {
      optimize: 'uglify2',
      uglify2: {
        mangler: {
          toplevel: false,
          beautify: false
        }
      },
      baseUrl: '/src',
      mainConfigFile: '/src/requireConfig.js',
      name: 'almond',
      include: 'concerto',
      insertRequire: ['concerto'],
      out: '/dist/src/concerto.js',
      wrap: true
    }
  }
};
