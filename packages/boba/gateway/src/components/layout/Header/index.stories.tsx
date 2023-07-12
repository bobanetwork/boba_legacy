import React from 'react'
import { Meta, StoryFn } from '@storybook/react'
import { Header } from '.'
import { HeaderProps } from './types'
import { Provider } from 'react-redux'
import createMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import { MemoryRouter } from 'react-router-dom'

const mockStore = createMockStore([thunk])

export default {
  title: 'Layout/Header',
  component: Header,
} as Meta

const Template: StoryFn<HeaderProps> = (args) => {
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
          <Header {...args} />
        </Provider>
      </MemoryRouter>
    </div>
  )
}

export const Default = Template.bind({})
