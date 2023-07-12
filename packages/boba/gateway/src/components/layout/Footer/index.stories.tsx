import React from 'react'
import { Meta, StoryFn } from '@storybook/react'
import { Footer } from '.'
import { FooterProps } from './types'
import { Provider } from 'react-redux'
import createMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import { MemoryRouter } from 'react-router-dom'

const mockStore = createMockStore([thunk])

export default {
  title: 'Layout/Footer',
  component: Footer,
} as Meta

const Template: StoryFn<FooterProps> = (args) => {
  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
      }}
    >
      <MemoryRouter>
        <Provider
          store={mockStore({
            ui: {
              theme: 'dark',
            },
          })}
        >
          <Footer {...args} />
        </Provider>
      </MemoryRouter>
    </div>
  )
}

export const Default = Template.bind({})
