import React from 'react'
import { TabHeaderType } from './types'
import { TabContainer, TabItem } from './styles'
import { Typography } from 'components/global/typography'

export const TabHeader = ({ options, callback }: TabHeaderType) => {
  const [selected, setSelected] = React.useState('All')

  const handleClick = (option: any) => {
    callback(option)
    setSelected(option.value)
  }

  return (
    <TabContainer>
      {options.map((option) => {
        const { value, label } = option
        return (
          <TabItem
            key={value}
            className={selected === value ? 'active' : ''}
            onClick={() => handleClick(option)}
          >
            <Typography variant="body1">{label}</Typography>
          </TabItem>
        )
      })}
    </TabContainer>
  )
}
