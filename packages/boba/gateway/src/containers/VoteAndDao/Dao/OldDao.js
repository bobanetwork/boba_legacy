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

import { Box, Typography } from '@mui/material'
import { openError, openModal } from 'actions/uiAction'
import { orderBy } from 'lodash'

import Button from 'components/button/Button'
import ListProposal from 'components/listProposal/listProposal'

import Select from 'components/select/Select'

import { selectDaoBalance, selectDaoBalanceX, selectDaoVotes, selectDaoVotesX, selectProposals, selectProposalThreshold } from 'selectors/daoSelector'
import { selectLoading } from 'selectors/loadingSelector'
import { selectAccountEnabled, selectLayer } from 'selectors/setupSelector'

import * as G from 'containers/Global.styles'
import * as S from './OldDao.styles'
import PageTitle from 'components/pageTitle/PageTitle'
import Connect from 'containers/connect/Connect'

const PROPOSAL_STATES = [
  { value: 'All', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Active', label: 'Active' },
  { value: 'Canceled', label: 'Canceled' },
  { value: 'Defeated', label: 'Defeated' },
  { value: 'Succeeded', label: 'Succeeded' },
  { value: 'Queued', label: 'Queued' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Executed', label: 'Executed' }
]

function OldDao() {

  const dispatch = useDispatch()

  const accountEnabled = useSelector(selectAccountEnabled())
  const layer = useSelector(selectLayer());
  const loading = useSelector(selectLoading([ 'PROPOSALS/GET' ]))

  let proposals = useSelector(selectProposals)
  proposals = orderBy(proposals, i => i.startTimestamp, 'desc')

  const balance = useSelector(selectDaoBalance)
  const balanceX = useSelector(selectDaoBalanceX)
  const votes = useSelector(selectDaoVotes)
  const votesX = useSelector(selectDaoVotesX)
  const proposalThreshold = useSelector(selectProposalThreshold)

  const [ selectedState, setSelectedState ] = useState(PROPOSAL_STATES[ 0 ])

  return (
    <S.DaoPageContainer>
      <PageTitle title={'Dao'} />
      <Connect
        userPrompt={'Please connect to Boba to vote and propose'}
        accountEnabled={accountEnabled}
        connectToBoba={true}
        layer={layer}
      />
      <S.DaoPageContent>
        <S.DaoWalletContainer>
          <Box sx={{ padding: '24px 0px' }}>
            <Typography variant="h4">Balances</Typography>
            <Typography variant="body1" style={{ opacity: '0.5' }}>BOBA:</Typography>
            <Typography variant="h4" >{!!layer ? Math.round(Number(balance)) : '--'}</Typography>
            <Typography variant="body1" style={{ opacity: '0.5' }}>xBOBA:</Typography>
            <Typography variant="h4" >{!!layer ? Math.round(Number(balanceX)) : '--'}</Typography>
          </Box>
          <G.DividerLine />
          <Box sx={{ padding: '24px 0px' }}>
            <Typography variant="h4">Votes</Typography>
            <Typography variant="body1" style={{ opacity: '0.5' }}>Boba:</Typography>
            <Typography variant="h4" >{!!layer ? Math.round(Number(votes)) : '--'}</Typography>
            <Typography variant="body1" style={{ opacity: '0.5' }}>xBoba:</Typography>
            <Typography variant="h4" >{!!layer ? Math.round(Number(votesX)) : '--'}</Typography>
            <Typography variant="body1" style={{ opacity: '0.5' }}>Total:</Typography>
            <Typography variant="h4" >{!!layer ? Math.round(Number(votes) + Number(votesX)) : '--'}</Typography>
            {layer === 'L2' &&
              <S.DaoWalletAction>
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={() => { dispatch(openModal('delegateDaoModal')) }}
                  disabled={!accountEnabled}
                >
                  Delegate BOBA
                </Button>
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={() => { dispatch(openModal('delegateDaoXModal')) }}
                  disabled={!accountEnabled}
                >
                  Delegate xBOBA
                </Button>
              </S.DaoWalletAction>
            }
            <Box sx={{ padding: '12px 0px' }}>
              <Typography variant="body3">Only votes delegated BEFORE the start of the active voting period are counted in your vote</Typography>
            </Box>
          </Box>
          <G.DividerLine />
          <Box sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '24px 0px'
          }}>
            <Button
              fullWidth={true}
              color="neutral"
              variant="outlined"
              disabled={!accountEnabled}
              onClick={() => {
                if (Number(votes + votesX) < Number(proposalThreshold)) {
                  dispatch(openError(`Insufficient BOBA to create a new proposal. You need at least ${proposalThreshold} BOBA + xBOBA to create a proposal.`))
                } else {
                  dispatch(openModal('newProposalModal'))
                }
              }}
            >
              Create new proposal
            </Button>
            <Box sx={{ padding: '12px 0px' }}>
              <Typography variant="body3">At least {proposalThreshold} BOBA + xBOBA are needed to create a new proposal</Typography>
            </Box>
          </Box>
        </S.DaoWalletContainer>
        <S.DaoProposalContainer>
          <S.DaoProposalHead>
            <Typography variant="h3">Proposals</Typography>
            <Select
              options={PROPOSAL_STATES}
              onSelect={(e) => {
                setSelectedState(e)
              }}
              sx={{ marginBottom: '20px' }}
              value={selectedState}
              newSelect={true}
            ></Select>
          </S.DaoProposalHead>
          <G.DividerLine />
          <S.DaoProposalListContainer>
            {!!loading && !proposals.length ? <Typography>Loading...</Typography> : null}
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
