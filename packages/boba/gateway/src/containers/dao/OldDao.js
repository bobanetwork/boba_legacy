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

import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Box } from '@mui/material'
import { openError, openModal } from 'actions/uiAction'
import { orderBy } from 'util/lodash';

import ListProposal from 'components/listProposal/listProposal'

import { Typography } from 'components/global/typography'
//import Select from 'components/select/Select'
import { Button } from 'components/global/button'
import {Preloader} from 'components/dao/preloader'
import {
  selectDaoBalance,
  selectDaoBalanceX,
  selectDaoVotes,
  selectDaoVotesX,
  selectProposals,
  selectProposalThreshold,
  selectLoading,
  selectAccountEnabled,
  selectLayer
} from 'selectors'

import * as G from 'containers/Global.styles'
import * as S from './OldDao.styles'
import Connect from 'containers/connect/Connect'
import { TabHeader } from 'components/global/tabHeader'

const PROPOSAL_STATES = [
  { value: 'All', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Active', label: 'Active' },
  { value: 'Canceled', label: 'Canceled' },
  { value: 'Defeated', label: 'Defeated' },
  /*{ value: 'Succeeded', label: 'Succeeded' },
  { value: 'Queued', label: 'Queued' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Executed', label: 'Executed' }*/
]

const OldDao = () => {

  const dispatch = useDispatch()

  const accountEnabled = useSelector(selectAccountEnabled())
  const layer = useSelector(selectLayer());
  const loading = useSelector(selectLoading(['PROPOSALS/GET']))

  let proposals = useSelector(selectProposals)
  proposals = orderBy(proposals, i => i.startTimestamp, 'desc')

  const balance = useSelector(selectDaoBalance)
  const balanceX = useSelector(selectDaoBalanceX)
  const votes = useSelector(selectDaoVotes)
  const votesX = useSelector(selectDaoVotesX)
  const proposalThreshold = useSelector(selectProposalThreshold)

  const [selectedState, setSelectedState] = useState(PROPOSAL_STATES[0])

  const handleNewProposal = () => {
    if (Number(votes + votesX) < Number(proposalThreshold)) {
      dispatch(
        openError(
          `Insufficient BOBA to create a new proposal. You need at least ${proposalThreshold} BOBA + xBOBA to create a proposal.`
        )
      )
    } else {
      dispatch(openModal('newProposalModal'))
    }
  }

  return (
    <S.DaoPageContainer>
      <Connect
        userPrompt={'Please connect to Boba to vote and propose'}
        accountEnabled={accountEnabled}
        connectToBoba={true}
        layer={layer}
      />
      <S.DaoPageContent>
        <S.DaoWalletContainer>
          <Box sx={{ paddingTop: '24px' }}>
            <Typography variant="h4">Balance</Typography>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                justifyContent:'center',
                gap: '10px',
                paddingTop:'24px',
              }}
            >
              <Box sx={{padding:'5px', gap:'10px 0px'}}>
                <Typography variant="body3" style={{ opacity: '0.5' }}>BOBA:</Typography>
                <Typography variant="head" style={{ color: 'rgba(144, 180, 6, 1)' }}>{!!layer ? Math.round(Number(balance)) : '--'}</Typography>
              </Box>
              <S.VerticalDivisor />
              <Box sx={{padding:'5px'}}>
                <Typography variant="body3" style={{ opacity: '0.5' }}>xBOBA:</Typography>
                <Typography variant="head" style={{ color: 'rgba(144, 180, 6, 1)' }}>{!!layer ? Math.round(Number(balanceX)) : '--'}</Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '24px 0px'
          }}>

            {layer === 'L2' && 
              <Button
              onClick={() => { dispatch(openModal('delegateDaoModal')) }}
              disable={!accountEnabled}
              label="Stake BOBA"
            />
            }
            <Button
              disable={!accountEnabled}
              onClick={() => handleNewProposal()}
              label="Create proposal"
              outline
            />
          </Box>
        </S.DaoWalletContainer>

        <S.DaoProposalContainer>
          <TabHeader
            options={PROPOSAL_STATES}
            callback={(e) => setSelectedState(e)}
          />
          

          <S.DaoProposalListContainer>
            {!!loading && !proposals.length && (
              <Preloader />
            )}
            {proposals
              // eslint-disable-next-line array-callback-return
              .filter((p) => {
                if (selectedState.value === 'All') {
                  return true;
                }
                return selectedState.value === p.state;
              })
              .map((p, index) => {
                return <React.Fragment key={index}>
                  <ListProposal proposal={p} />
                </React.Fragment>
              })}
          </S.DaoProposalListContainer>
        </S.DaoProposalContainer>
      </S.DaoPageContent>
    </S.DaoPageContainer>
  )
}

export default React.memo(OldDao)
