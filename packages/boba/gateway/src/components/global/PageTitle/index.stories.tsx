import React from 'react'
import { Meta, StoryFn } from '@storybook/react'

import { PageTitle } from './'
import { PageTitleTypes } from './types'

export default {
  title: 'Components/PageTitle',
  component: PageTitle,
} as Meta

const Template: StoryFn<PageTitleTypes> = (args: any) => <PageTitle {...args} />

export const Default = Template.bind({})
Default.args = {
  title: 'History',
  slug: 'Look back on past transactions',
}
