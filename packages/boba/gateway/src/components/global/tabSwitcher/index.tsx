import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveNetworkName } from 'selectors'
import { TabSwitcherInterface } from './types'
import { Typography } from 'components/global/typography'
import { TabSwitcherContainer, Tab } from './styles'

export const TabSwitcher = ({ tabs, onSelect }: TabSwitcherInterface) => {
  const currentTabs = Object.values(tabs)
  const [selectedTab, setSelectedTab] = useState<string | null>(
    currentTabs?.[0]?.name
  )
  const activeNetworkName = useSelector(selectActiveNetworkName())

  const handleClick = (name: string) => {
    onSelect(name)
    setSelectedTab(name)
  }
  return (
    <TabSwitcherContainer>
      {currentTabs.map((currentTab) => {
        const { name, tab } = currentTab
        const index = name.slice(0, 2)?.toLowerCase()
        return (
          <Tab
            onClick={() => handleClick(name)}
            key={index}
            active={selectedTab === name}
          >
            <Typography variant="body1">
              {activeNetworkName[index]} Pools
            </Typography>
          </Tab>
        )
      })}
    </TabSwitcherContainer>
  )
}
