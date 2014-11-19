module.exports = {
  options: {
    mangle: false
  },
  my_target: {
    files: {
      'build/concerto-min.js': [
        '<%= data.files %>'
      ]
    }
  }
};
