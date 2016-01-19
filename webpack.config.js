var path = require('path');

module.exports = {
  entry: "./tests/index.js",
  output: {
    path: __dirname,
    filename: "bundle.js"
  },
  devtool: "source-map",
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        include: [path.resolve('./src'), path.resolve('./tests')],
        query: {
          presets: ['es2015'],
          cacheDirectory: true
        }
      }
    ]
  }
};
