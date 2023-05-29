import React from 'react'
import { Meta, StoryFn } from '@storybook/react'

import { MaxInput, MaxInputProps } from './'

export default {
  title: 'Components/MaxInput',
  component: MaxInput,
} as Meta

const Template: StoryFn<MaxInputProps> = (args) => <MaxInput {...args} />

export const Default = Template.bind({})
Default.args = {
  max: 100,
  onValueChange: (value) => console.log(`New value: ${value}`),
}

export const WithInitialValue = Template.bind({})
WithInitialValue.args = {
  max: 100,
  onValueChange: (value) => console.log(`New value: ${value}`),
  initialValue: 50,
}
