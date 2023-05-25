import React from 'react'
import { Meta, Story } from '@storybook/react'

import { Button, ButtonTypes } from './'

export default {
  title: 'Example/Button',
  component: Button,
} as Meta

const Template: Story<ButtonTypes> = (args: any) => <Button {...args} />

export const Default = Template.bind({})
Default.args = {
  disable: false,
  loading: false,
  label: 'Default Button',
}

export const Disabled = Template.bind({})
Disabled.args = {
  disable: true,
  loading: false,
  label: 'Disabled Button',
}

export const Loading = Template.bind({})
Loading.args = {
  loading: true,
  disable: false,
  label: 'Loading...',
}

export const Hover = Template.bind({})
Hover.args = {
  label: 'Hover Button',
}
