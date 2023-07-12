import { StorybookConfig } from '@storybook/react-webpack5'
import path from 'path'

const storybookConfig: StorybookConfig = {
  features: {
    storyStoreV7: true,
  },
  staticDirs: ['../src/assets'],
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-toolbars',
    '@storybook/addon-actions',
    '@storybook/addon-styling',
    {
      name: 'storybook-addon-sass-postcss',
      options: {
        rule: {
          test: /\.(scss|sass)$/i,
        },
      },
    },
  ],
  webpackFinal: async (config) => {
    if (!config.resolve) {
      config.resolve = {}
    }
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
      buffer: require.resolve('buffer'),
    }

    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, '../src'),
    ]

    return config
  },
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  docs: {
    autodocs: true,
  },
}

export default storybookConfig
