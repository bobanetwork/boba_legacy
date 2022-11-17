/*
Copyright 2021-present Boba Network.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import React from 'react'

import { Typography } from '@mui/material'

import * as S from './Transaction.styles'
import { selectNetwork } from 'selectors/networkSelector'
import { useSelector } from 'react-redux'
import { getNetwork } from 'util/masterConfig'

function FastExit({
  link,
  status,
  chain,
  blockNumber,
  oriChain,
  oriHash,
  age,
  unixTime
}) {

  const currentNetwork = useSelector(selectNetwork())
  const nw = getNetwork()

  const chainLink = ({hash}) => {
    let network = nw[currentNetwork]
    if (!!network && !!network['L2']) {
          return `${network['L2'].transaction}${hash}`
    }
    return ''
  }

  const secondsAgo = Math.round(Date.now() / 1000) - unixTime
  let timeLabel = `Fast Exit was started ${secondsAgo} seconds ago`

  return (
        <S.Wrapper>
          <S.GridContainer container
            spacing={2}
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
          >
            <S.GridItemTag item
              xs={12}
              md={12}
              style={{
                justifyContent: 'flex-start',
                alignItems:'center',
              }}
            >
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems:'flex-start'}}>
                  <Typography variant="overline" style={{fontSize: '0.9em', lineHeight: '1.0em'}}>{blockNumber}</Typography>
                  <Typography variant="overline" style={{lineHeight: '1.0em', color: 'green'}}>
                    {timeLabel}
                  </Typography>
                  <Typography variant="body3" style={{fontSize: '0.7em', lineHeight: '1.0em'}}>
                    Hash:&nbsp;
                    <a
                      href={chainLink({hash:oriHash})}
                      target={'_blank'}
                      rel='noopener noreferrer'
                      style={{ color: 'rgba(255, 255, 255, 0.3)', fontFamily: 'MessinaSB', fontSize: '0.8em'}}
                    >
                      {oriHash}
                    </a>
                  </Typography>
                </div>
            </S.GridItemTag>
          </S.GridContainer>
        </S.Wrapper>
      )

}

export default FastExit
