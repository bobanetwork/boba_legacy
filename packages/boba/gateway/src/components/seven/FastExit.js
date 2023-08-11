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

import { ExitWrapper, Hash, HashContainer } from './styles'

import networkService from 'services/networkService'

function FastExit({
  blockNumber,
  oriHash,
  unixTime
}) {


  const chainLink = ({hash}) => {
    if (networkService.networkConfig[ 'L2' ]) {
      return `${networkService.networkConfig['L2'].transaction}${hash}`
    }
    return ''
  }

  const secondsAgo = Math.round(Date.now() / 1000) - unixTime
  let timeLabel = `Fast Exit was started ${secondsAgo} seconds ago`

  return (
          <ExitWrapper>
            <Typography variant="overline">{blockNumber}</Typography>
            
            <HashContainer variant="body3">
              Hash:&nbsp;
              <Hash
                href={chainLink({hash:oriHash})}
                target={'_blank'}
                rel='noopener noreferrer'
              >
                {oriHash}
              </Hash>
      </HashContainer>
      <Typography variant="overline" style={{color: 'green'}}>
              {timeLabel}
            </Typography>
          </ExitWrapper>
      )

}

export default FastExit
