import React from 'react'
import { StoryFn, Meta } from '@storybook/react'

import { Dropdown } from './index/form'
import { IDropdownProps } from './interfaces/interfaces'

export default {
  title: 'Components/Dropdown/Form',
  component: Dropdown,
} as Meta

const Template: StoryFn<IDropdownProps> = (args: any) => <Dropdown {...args} />

export const Default = Template.bind({})
Default.args = {
  defaultItem: {
    value: '',
    label: 'Select Network',
    imgSrc: 'default',
  },
  items: [
    {
      value: 'eth',
      label: 'Ethereum Network',
      imgSrc:
        'https://raw.githubusercontent.com/bobanetwork/token-list/main/assets/eth.svg',
    },
    {
      value: 'uni',
      label: 'Uniswap',
      imgSrc:
        'https://raw.githubusercontent.com/bobanetwork/token-list/main/assets/uni.svg',
    },
  ],
}
