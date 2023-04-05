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

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Box, Typography } from '@mui/material'
import { openError, openModal } from 'actions/uiAction'
import orderBy from 'lodash/orderBy'

import Button from 'components/button/Button'
import ListProposal from 'components/listProposal/listProposal'

import Select from 'components/select/Select'

import { selectLatestProposalState, selectProposals } from 'selectors/daoSelector'
import { selectLoading } from 'selectors/loadingSelector'
import { selectAccountEnabled, selectLayer } from 'selectors/setupSelector'

import { fetchLockRecords } from 'actions/veBobaAction'
import { selectLockRecords } from 'selectors/veBobaSelector'


import {DividerLine} from 'containers/Global.styles'
import * as S from './Dao.styles'
import { setConnectBOBA } from 'actions/setupAction'

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

function DAO() {

  const dispatch = useDispatch()

  const nftRecords = useSelector(selectLockRecords);
  const accountEnabled = useSelector(selectAccountEnabled())
  const layer = useSelector(selectLayer());
  const loading = useSelector(selectLoading([ 'PROPOSALS/GET' ]))
  const hasLiveProposal = useSelector(selectLatestProposalState)

  let proposals = useSelector(selectProposals)
  proposals = orderBy(proposals, i => i.startTimestamp, 'desc')

  const [ balance, setBalance ] = useState('--');
  const [ selectedState, setSelectedState ] = useState(PROPOSAL_STATES[ 0 ])

  useEffect(() => {
    if (!!accountEnabled) {
      dispatch(fetchLockRecords());
    }
  }, [ accountEnabled, dispatch ]);

  useEffect(() => {
    if (!!accountEnabled) {
      const veBoba = nftRecords.reduce((s, record) => s + Number(record.balance), 0);
      setBalance(veBoba.toFixed(2))
    }
  }, [ accountEnabled, nftRecords ]);


  async function connectToBOBA() {
    dispatch(setConnectBOBA(true))
  }

  return (
    <S.DaoPageContent>
      <S.DaoWalletContainer>
        <Box sx={{ padding: '24px 0px' }}>
          <Typography variant="h4">Voting power</Typography>
          <Typography variant="body1" style={{ opacity: '0.5' }}>govBOBA:</Typography>
          <Typography variant="h4" >{balance}</Typography>
        </Box>
        <DividerLine />
        {
          (!accountEnabled || layer !== 'L2' )?
            <Button
              fullWidth={true}
              variant="outlined"
              color="primary"
              size="large"
              tooltip={'Please connect to Boba to vote and propose'}
              onClick={() => connectToBOBA()}
            >
              Connect to BOBA
            </Button>
            : <Button
              fullWidth={true}
              color="neutral"
              variant="outlined"
              disabled={!nftRecords.length}
              onClick={() => {
                if (hasLiveProposal) {
                  // If proposer has active proposal so user can create new one.
                  dispatch(openError(`You already have one live proposal.`))
                } else {
                  dispatch(openModal('newProposalModal'))
                }
              }}
            >
              Create new proposal
            </Button>
        }

        {accountEnabled
          && nftRecords
          && !nftRecords.length
          ? <Typography variant="body2">
            Oh! You don't have veBoba NFT, Please go to Lock to get them.
          </Typography>
          : null
        }
      </S.DaoWalletContainer>
      <S.DaoProposalContainer>
        <S.DaoProposalHead>
          <Typography variant="h3">Proposals</Typography>
          <Select
            options={PROPOSAL_STATES}
            onSelect={(e) => {
              console.log('e', e)
              setSelectedState(e)
            }}
            sx={{ marginBottom: '20px' }}
            value={selectedState}
          ></Select>
        </S.DaoProposalHead>
        <DividerLine />
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
  )
}

export default React.memo(DAO)
