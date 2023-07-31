import React from 'react'
import { Meta, StoryFn } from '@storybook/react'

import { MaxInput } from './'
import { MaxInputTypes } from './types'

export default {
  title: 'Components/MaxInput',
  component: MaxInput,
} as Meta

const Template: StoryFn<MaxInputTypes> = (args: MaxInputTypes) => (
  <MaxInput {...args} />
)

export const Default = Template.bind({})
Default.args = {
  max: 100,
  onValueChange: (value: number) => console.log(`New value: ${value}`),
}

export const WithInitialValue = Template.bind({})
WithInitialValue.args = {
  max: 100,
  onValueChange: (value: number) => console.log(`New value: ${value}`),
  initialValue: 50,
}
