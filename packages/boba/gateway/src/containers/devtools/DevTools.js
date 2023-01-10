import React from 'react'
import {  useSelector } from 'react-redux'

import PageTitle from 'components/pageTitle/PageTitle'
import Connect from 'containers/connect/Connect'

import { selectLayer, selectAccountEnabled } from 'selectors/setupSelector'

import TxBuilder from './TxBuilder'

import * as S from './DevTools.styles'

const DevTools = ({projectType}) => {

  const networkLayer = useSelector(selectLayer())
  const accountEnabled = useSelector(selectAccountEnabled())

  return (
    <S.PageContainer>
      <PageTitle title={'Dev Tools'} />
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
