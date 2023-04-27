import React, { useState } from 'react'
import styled from 'styled-components'
import { useTheme } from '@mui/material'
import { Column, Row } from 'components/global/containers'
type TabsType = {
  title: string
  content: JSX.Element
}

type TabsContainerType = {
  data: TabsType[]
}

const TabsContainer = styled.div`
  width: 100%;
  max-width: 500px;
`

const TabButton = styled.button<{ theme: any }>`
  background: transparent;
  border: 0px;
  font-size: 17px;
  cursor: pointer;
  color: #fff;
  margin: 0px 5px -12px 5px;
  padding: 15px 24px 25px 24px;
  &:first-of-type {
    margin-left: 0px;
  }
  &.active {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(50px);
    border-radius: 12px 12px 0px 0px;
    filter: drop-shadow(0px 4px 20px rgba(35, 92, 41, 0.06));
  }
`
export const Tabs = ({ data }: TabsContainerType) => {
  const [activeTab, setActiveTab] = useState<number>(0)
  const theme = useTheme()
  console.log(theme, 'theme')
  const handleTabClick = (index: number) => {
    setActiveTab(index)
  }
  return (
    <TabsContainer>
      <Column>
        <Row>
          {data.map((tab, index) => (
            <TabButton
              key={index}
              className={activeTab === index ? 'active' : ''}
              onClick={() => handleTabClick(index)}
            >
              {tab.title}
            </TabButton>
          ))}
        </Row>
      </Column>
      {data[activeTab].content}
    </TabsContainer>
  )
}
