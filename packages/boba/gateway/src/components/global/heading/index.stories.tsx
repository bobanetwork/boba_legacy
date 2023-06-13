import React from 'react'
import { Meta, StoryFn } from '@storybook/react'

import Heading from '.'
import { HeadingProps } from './types'

export default {
  title: 'Components/Heading',
  component: Heading,
} as Meta

const Template: StoryFn<HeadingProps> = (args: any) => (
  <Heading {...args}>Heading {args.variant}</Heading>
)

export const Default = Template.bind({})

export const H1 = Template.bind({})
H1.args = {
  variant: 'h1',
}

export const H2 = Template.bind({})
H2.args = {
  variant: 'h2',
}

export const H3 = Template.bind({})
H3.args = {
  variant: 'h3',
}

export const H4 = Template.bind({})
H4.args = {
  variant: 'h4',
}

export const H5 = Template.bind({})
H5.args = {
  variant: 'h5',
}

export const H6 = Template.bind({})
H6.args = {
  variant: 'h6',
}
