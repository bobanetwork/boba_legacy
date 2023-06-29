import React from 'react'
import { Meta, StoryFn } from '@storybook/react'

import { PageTitle } from '.'
import { PageTitleTypes } from './types'
import { BrowserRouter } from 'react-router-dom'

export default {
  title: 'Layout/PageTitle',
  component: PageTitle,
  decorators: [
    (StoryFn) => (
      <BrowserRouter>
        <StoryFn />
      </BrowserRouter>
    ),
  ],
} as Meta

const Template: StoryFn<PageTitleTypes> = (args: any) => <PageTitle {...args} />

export const Default = Template.bind({})
Default.args = {
  title: 'History',
  slug: 'Look back on past transactions',
}

export const WithoutSlug = Template.bind({})
WithoutSlug.args = {
  title: 'Title only',
}
