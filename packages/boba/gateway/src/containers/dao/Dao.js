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
import { orderBy } from 'lodash'

import Button from 'components/button/Button'
import ListProposal from 'components/listProposal/listProposal'
import PageTitle from 'components/pageTitle/PageTitle'
import Select from 'components/select/Select'

import { selectLatestProposalState, selectProposals } from 'selectors/daoSelector'
import { selectLoading } from 'selectors/loadingSelector'
import { selectAccountEnabled } from 'selectors/setupSelector'

import { setConnectBOBA } from 'actions/setupAction'
import { fetchLockRecords } from 'actions/veBobaAction'
import * as G from 'containers/Global.styles'
import { selectLockRecords } from 'selectors/veBobaSelector'
import * as styles from './Dao.module.scss'
import * as S from './Dao.styles'

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
  const loading = useSelector(selectLoading([ 'PROPOSALS/GET' ]))
  const hasLiveProposal = useSelector(selectLatestProposalState)
  let proposals = useSelector(selectProposals)

  const [ balance, setBalance ] = useState('--');
  const [ selectedState, setSelectedState ] = useState('All')

  async function connectToBOBA() {
    dispatch(setConnectBOBA(true))
  }

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

  proposals = orderBy(proposals, i => i.startTimestamp, 'desc')

  return (
    <div className={styles.container}>

      <S.DaoPageContainer>
        <PageTitle title={'Dao'} />
        <S.DaoPageContent>
          <S.DaoWalletContainer>
            <Box sx={{ padding: '24px 0px' }}>
              <Typography variant="h4">Voting power</Typography>
              <Typography variant="body1" style={{ opacity: '0.5' }}>govBOBA:</Typography>
              <Typography variant="h4" >{balance}</Typography>
            </Box>
            <G.DividerLine />
            <Box
              display="flex"
              flexDirection="column"
              gap="10px"
              fullWidth={true}
              py={2}
            >
              {
                !accountEnabled ?
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
            </Box>

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
                onSelect={(e) => setSelectedState(e)}
                sx={{ marginBottom: '20px' }}
                value={selectedState}
                newSelect={true}
              ></Select>
            </S.DaoProposalHead>
            <G.DividerLine />
            <S.DaoProposalListContainer>
              {!!loading && !proposals.length ? <div className={styles.loadingContainer}> Loading... </div> : null}
              {proposals
                // eslint-disable-next-line array-callback-return
                .filter((p) => {
                  if (selectedState === 'All') {
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
    </div>
  )
}

export default React.memo(DAO)
