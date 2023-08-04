// @ts-ignore
const webpack = require('webpack')
const { Buffer } = require('buffer')
const path = require('path')

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
    }
  } else {
    config.resolve.fallback.process = require.resolve('process')
    config.resolve.fallback.stream = require.resolve('stream-browserify')
    config.resolve.fallback.fs = require.resolve('browserify-fs')
    config.resolve.fallback.path = require.resolve('path-browserify')
    config.resolve.fallback.assert = require.resolve('assert')
    config.resolve.fallback.http = require.resolve('http-browserify')
    config.resolve.fallback.https = require.resolve('https-browserify')
    config.resolve.fallback.os = require.resolve('os-browserify')
    config.resolve.fallback.zlib = require.resolve('browserify-zlib')
  }

  config.resolve.fallback.Buffer = require.resolve('buffer')

  // Agrega el plugin ProvidePlugin para process
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process',
    })
  )

  config.module.rules.push({
    test: /\.(png|svg)$/,
    use: ['file-loader'],
  })

  return config
}
