import React from 'react'
import { BrowserRouter } from 'react-router-dom'

import { Meta, StoryFn } from '@storybook/react'

import { Background } from '.'

export default {
  title: 'Components/Background',
  component: Background,
} as Meta

const Template: StoryFn = (args: any) => <Background />

export const Default = Template.bind({})
