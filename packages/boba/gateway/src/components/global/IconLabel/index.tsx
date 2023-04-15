import React from 'react'
import styled from 'styled-components'

import { getCoinImage } from 'util/coinImage'

import { Text, Small } from 'components/global/text'
import { Row, Column } from 'components/global/containers'
import { AddToMetamask } from 'components/global/addToMetamask'

const Icon = styled.img`
  display: flex;
  width: 35px;
  height: 35px;
  margin-right: 10px;
`

const IconLabelContainer = styled(Row)`
  .metamask {
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  &:hover {
    .metamask {
      opacity: 1;
    }
  }
`

export const IconLabel = (props: any) => {
  const { symbol, name } = props.token
  const logo = getCoinImage(symbol)

  return (
    <>
      <IconLabelContainer>
        <Column>
          <Row>
            <div>
              <Icon src={logo} alt="logo" />
            </div>
            <div>
              <Text>{symbol}</Text>
              <Small>{name}</Small>
            </div>
          </Row>
        </Column>
        <AddToMetamask token={props.token} className="metamask" />
      </IconLabelContainer>
    </>
  )
}
