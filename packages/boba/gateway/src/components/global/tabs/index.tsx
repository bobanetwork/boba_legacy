import React, { useState } from 'react'
import { TabHeader, TabContent, TabIndex } from './styles'
import { TabData } from './types'

export const TabComponent = ({ tabs }: TabData) => {
  const [activeTab, setActiveTab] = useState<number>(0)

  return (
    <>
      <TabHeader>
        {tabs?.map((tab, index) => (
          <TabIndex
            key={index}
            onClick={() => setActiveTab(index)}
            active={activeTab === index ? true : false}
          >
            {tab.label}
          </TabIndex>
        ))}
      </TabHeader>

      <TabContent>{tabs[activeTab].content}</TabContent>
    </>
  )
}
