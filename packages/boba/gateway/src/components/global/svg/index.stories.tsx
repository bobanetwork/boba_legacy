import React from 'react'
import { Meta, StoryFn } from '@storybook/react'
import Arrow from '../../../images/icons/arrowdown.svg'
import { Svg } from './'
import { SvgTypes } from './types'
import styled from 'styled-components'
export default {
  title: 'Components/Svg',
  component: Svg,
  argTypes: {
    fill: { control: 'color' },
  },
} as Meta

const ArrowOnHover = styled.div`
  svg {
    &:hover {
      fill: yellow;
    }
  }
`

const Template: StoryFn<SvgTypes> = (args: SvgTypes) => (
  <ArrowOnHover>
    <Svg {...args} />
  </ArrowOnHover>
)

export const Default = Template.bind({})
Default.args = {
  src: Arrow,
  fill: 'lime',
  className: '.yellowOnHover',
}
