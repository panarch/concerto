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
      insertRequire: ['Concerto'],
      out: 'dist/concerto-min.js',
      wrap: true
    }
  }
};
