const path = require('path')
const { IgnorePlugin, ProvidePlugin } = require('webpack')

module.exports = {
  plugins: [
    new IgnorePlugin({ resourceRegExp: /electron/ }),
    new IgnorePlugin({ resourceRegExp: /^scrypt$/ }),
    new IgnorePlugin({ resourceRegExp: /solidity-analyzer/ }),
    new IgnorePlugin({ resourceRegExp: /fsevents/ }),
    new ProvidePlugin({
      WebSocket: 'ws',
      fetch: ['node-fetch', 'default'],
    }),
  ],
  resolve: {
    modules: ['node_modules', '../bundler_sdk/node_modules', '../bundler_utils/node_modules', '../accountabstraction/node_modules'],
    alias: {
      // the packages below has a "browser" and "main" entry. Unfortunately, webpack uses the "browser" entry,
      // even through we explicitly use set "target: node"
      // (see https://github.com/webpack/webpack/issues/4674)
      '@ethersproject/random': path.resolve(
        __dirname,
        '../../../node_modules/@ethersproject/random/lib/index.js'
      ),
      '@ethersproject/base64': path.resolve(
        __dirname,
        '../../../node_modules/@ethersproject/base64/lib/index.js'
      ),
    },
  },
  target: 'node',
  entry: './dist/src/exec.js',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    path: path.resolve(__dirname),
    filename: 'bundler.js',
  },
  stats: 'errors-only',
}
