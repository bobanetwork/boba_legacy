import React from 'react'
import { SwitchButton } from './'
import { SwitchButtonTypes } from './types'
import { Meta, StoryFn } from '@storybook/react'

export default {
  title: 'Components/SwitchButton',
  component: SwitchButton,
} as Meta

const Template: StoryFn<SwitchButtonTypes> = (args: any) => (
  <SwitchButton {...args} />
)

export const Default = Template.bind({})
Default.args = {
  isDisable: false,
  isActive: false,
}

export const Active = Template.bind({})
Active.args = {
  isDisable: false,
  isActive: true,
}

export const Disabled = Template.bind({})
Disabled.args = {
  isDisable: true,
  isActive: false,
}

export const ActiveDisable = Template.bind({})
ActiveDisable.args = {
  isDisable: true,
  isActive: true,
}
