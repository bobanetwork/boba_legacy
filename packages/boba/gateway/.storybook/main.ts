import { StorybookConfig } from '@storybook/react-webpack5'

const config: StorybookConfig = {
  features: {
    storyStoreV7: true,
  },
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-toolbars',
    '@storybook/addon-actions',
    '@storybook/addon-styling',
  ],

  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
}

export default config
