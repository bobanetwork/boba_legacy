import React from 'react'
import { Meta, StoryFn } from '@storybook/react'

import { Typography } from './'
import { TypographyProps } from './types'

export default {
  title: 'Components/Typography',
  component: Typography,
} as Meta

const Template: StoryFn<TypographyProps> = (args: any) => (
  <Typography {...args}>
    Heading 1/Roboto/ medium/ 20pt/1.25 rem {args.variant}
  </Typography>
)

export const Default = Template.bind({})

export const H1 = Template.bind({})
H1.args = {
  variant: 'h1',
}

export const Head = Template.bind({})
Head.args = {
  variant: 'head',
}

export const Title = Template.bind({})
Title.args = {
  variant: 'title',
}

export const Body1 = Template.bind({})
Body1.args = {
  variant: 'body1',
}

export const Body2 = Template.bind({})
Body2.args = {
  variant: 'body2',
}

export const Body3 = Template.bind({})
Body3.args = {
  variant: 'body3',
}

export const SubTitle = Template.bind({})
SubTitle.args = {
  variant: 'subtitle',
}
