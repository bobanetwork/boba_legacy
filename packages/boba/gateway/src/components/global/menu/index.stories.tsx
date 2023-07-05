import React from 'react'
import { Meta, StoryFn } from '@storybook/react'

import Menu from './'
import { MenuProps } from './types'

export default {
  title: 'Components/Menu',
  component: Menu,
} as Meta

const Template: StoryFn<MenuProps> = (args: any) => <Menu {...args} />

export const Default = Template.bind({})
Default.args = {
  label: 'Open Menu',
  options: [
    {
      label: 'Alert 1',
      onclick: () => alert(1),
    },
    {
      label: 'Say Hi!',
      onclick: () => alert('Hello World!'),
    },
  ],
}
