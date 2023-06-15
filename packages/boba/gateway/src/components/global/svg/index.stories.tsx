import React from 'react'
import { Meta, StoryFn } from '@storybook/react'
import Arrow from '../../../images/icons/arrowdown.svg'
import { Svg, SvgProps } from './'

export default {
  title: 'Components/Svg',
  component: Svg,
  argTypes: {
    fill: { control: 'color' },
  },
} as Meta

const Template: StoryFn<SvgProps> = (args: SvgProps) => <Svg {...args} />

export const Default = Template.bind({})
Default.args = {
  src: Arrow,
  fill: 'lime',
}
