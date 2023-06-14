import React from 'react'
import { Meta, StoryFn } from '@storybook/react'
import Header from '.'
import { HeaderProps } from './types'

export default {
  title: 'Layout/Header',
  component: Header,
} as Meta

const Template: StoryFn<HeaderProps> = (args) => <Header {...args} />

export const Default = Template.bind({})
