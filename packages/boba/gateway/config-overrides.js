// @ts-ignore
const webpack = require('webpack');
const { Buffer } = require('buffer');
const path = require('path');

module.exports = (config, env) => {
  // Resto de tu configuración...

  // Verifica si resolve.fallback ya está definido
  if (!config.resolve.fallback) {
    config.resolve.fallback = {
      process: require.resolve('process/browser'),
      stream: require.resolve('stream-browserify'),
      fs: require.resolve('browserify-fs'),
      path: require.resolve('path-browserify'),
      assert: require.resolve('assert'),
      http: require.resolve('http-browserify'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify'),
      zlib: require.resolve('browserify-zlib'),
    };
  } else {
    config.resolve.fallback.process = require.resolve('process');
    config.resolve.fallback.stream = require.resolve('stream-browserify');
    config.resolve.fallback.fs = require.resolve('browserify-fs');
    config.resolve.fallback.path = require.resolve('path-browserify');
    config.resolve.fallback.assert = require.resolve('assert');
    config.resolve.fallback.http = require.resolve('http-browserify');
    config.resolve.fallback.https = require.resolve('https-browserify');
    config.resolve.fallback.os = require.resolve('os-browserify');
    config.resolve.fallback.zlib = require.resolve('browserify-zlib');
  }

  config.resolve.fallback.Buffer = require.resolve('buffer');

  config.resolve.alias = {
    ...config.resolve.alias,
    "components": path.resolve(__dirname, 'src/components'),
    "actions": path.resolve(__dirname, 'src/actions'),
    "api": path.resolve(__dirname, 'src/api'),
    "assets": path.resolve(__dirname, 'src/assets'),
    "containers": path.resolve(__dirname, 'src/containers'),
    "deployment": path.resolve(__dirname, 'src/deployment'),
    "fonts": path.resolve(__dirname, 'src/fonts'),
    "hooks": path.resolve(__dirname, 'src/hooks'),
    "images": path.resolve(__dirname, 'src/images'),
    "layout": path.resolve(__dirname, 'src/layout'),
    "reducers": path.resolve(__dirname, 'src/reducers'),
    "selectors": path.resolve(__dirname, 'src/selectors'),
    "services": path.resolve(__dirname, 'src/services'),
    "store": path.resolve(__dirname, 'src/store'),
    "themes": path.resolve(__dirname, 'src/themes'),
    "util": path.resolve(__dirname, 'src/util'),
  }

  config.resolve.extensions.push(".ts", ".tsx");

  // Agrega el plugin ProvidePlugin para process
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process',
    })
  );

  console.log(config)

  return config;
};
