import React from 'react'
import { Meta, StoryFn } from '@storybook/react'
import Header from '.'
import { HeaderProps } from './types'
import { Provider } from 'react-redux'
import createMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

const mockStore = createMockStore([thunk])

export default {
  title: 'Layout/Header',
  component: Header,
} as Meta

const Template: StoryFn<HeaderProps> = (args) => {
  return (
    <div style={{ height: '100vh' }}>
      <Provider
        store={mockStore({
          ui: {
            theme: 'dark',
          },
        })}
      >
        <Header {...args} />
      </Provider>
    </div>
  )
}

export const Default = Template.bind({})
