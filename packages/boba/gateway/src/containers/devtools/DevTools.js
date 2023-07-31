import React from 'react'
import {  useSelector } from 'react-redux'

import Connect from 'containers/connect/Connect'

import { selectLayer, selectAccountEnabled } from 'selectors'

import TxBuilder from './TxBuilder'

import * as S from './DevTools.styles'

const DevTools = ({projectType}) => {

  const networkLayer = useSelector(selectLayer())
  const accountEnabled = useSelector(selectAccountEnabled())

  return (
    <S.PageContainer>
      <Connect
        userPrompt={'Please connect to Boba to enable all features'}
        accountEnabled={accountEnabled}
        connectToBoba={true}
        layer={networkLayer}
      />
      <TxBuilder />
    </S.PageContainer>
  )
}

export default DevTools;
