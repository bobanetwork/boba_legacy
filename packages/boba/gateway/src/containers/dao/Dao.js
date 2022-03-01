/*
Copyright 2019-present OmiseGO Pte Ltd

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
import { useDispatch, useSelector } from 'react-redux'
import { openError, openModal } from 'actions/uiAction'
import { Box, Typography } from '@mui/material'

import Button from 'components/button/Button'
import ProposalList from './proposal/ProposalList'

import { selectDaoBalance, selectDaoVotes, selectDaoBalanceX, selectDaoVotesX, selectProposalThreshold } from 'selectors/daoSelector'
import { selectLayer, selectAccountEnabled } from 'selectors/setupSelector'

import WalletPicker from 'components/walletpicker/WalletPicker'

import * as S from './Dao.styles'
import * as styles from './Dao.module.scss'
import PageTitle from 'components/pageTitle/PageTitle'
import { Circle } from '@mui/icons-material'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import AlertIcon from 'components/icons/AlertIcon'
import networkService from 'services/networkService'
import truncateMiddle from 'truncate-middle'
import WalletIcon from 'components/icons/WalletIcon'

function DAO() {

  const dispatch = useDispatch()

  const balance = useSelector(selectDaoBalance)
  const balanceX = useSelector(selectDaoBalanceX)
  const votes = useSelector(selectDaoVotes)
  const votesX = useSelector(selectDaoVotesX)
  const proposalThreshold = useSelector(selectProposalThreshold)
  const wAddress = networkService.account ? truncateMiddle(networkService.account, 6, 6, '...') : '';

  let layer = useSelector(selectLayer())
  const accountEnabled = useSelector(selectAccountEnabled())

  return (
    <>

      <div className={styles.container}>
        <S.DaoPageContainer>
          <PageTitle title="DAO" />
            <S.DaoWalletHead>
            {
              (layer !== 'L2') ?
                <Typography variant="body2" sx={{ color: '#FF6A55' }}><Circle sx={{ height: "10px", width: "10px" }} /> Not connected to Boba L2</Typography>
                : <Typography variant="body2" sx={{ color: '#BAE21A' }}><Circle sx={{ height: "10px", width: "10px" }} /> Connected</Typography>
            }
            </S.DaoWalletHead>
          <S.DaoPageContent>

            <S.DaoWalletContainer>
              <Box sx={{ padding: '24px 0px' }}>
                {!accountEnabled ?
                  <Typography variant="body3" sx={{ opacity: "0.6" }}>Please connect to Boba to vote and propose.</Typography>
                  : <Box sx={{ display: 'flex', alignItems: 'center'}}> <WalletIcon /> &nbsp; <Typography variant="body3">{wAddress}</Typography></Box>
                }
              </Box>
              <S.DividerLine />
              <Box sx={{ padding: '24px 0px' }}>
                <Typography variant="h4">Balances</Typography>
                <Typography variant="body1" style={{ opacity: '0.5' }}>BOBA:</Typography>
                <Typography variant="h4" >{!!layer ? Math.round(Number(balance)) : '--'}</Typography>
                <Typography variant="body1" style={{ opacity: '0.5' }}>xBOBA:</Typography>
                <Typography variant="h4" >{!!layer ? Math.round(Number(balanceX)) : '--'}</Typography>
              </Box>
              <S.DividerLine />
              <Box sx={{ padding: '24px 0px' }}>
                <Typography variant="h4">Votes</Typography>
                <Typography variant="body1" style={{ opacity: '0.5' }}>Boba:</Typography>
                <Typography variant="h4" >{!!layer ? Math.round(Number(votes)) : '--'}</Typography>
                <Typography variant="body1" style={{ opacity: '0.5' }}>xBoba:</Typography>
                <Typography variant="h4" >{!!layer ? Math.round(Number(votesX)) : '--'}</Typography>
                <Typography variant="body1" style={{ opacity: '0.5' }}>Total:</Typography>
                <Typography variant="h4" >{!!layer ? Math.round(Number(votes) + Number(votesX)) : '--'}</Typography>
                {
                  !layer ?
                    <S.DaoWalletPickerContainer>
                      <WalletPicker label="Connect to Boba"/>
                    </S.DaoWalletPickerContainer> : layer === 'L2' ?
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
                      : <S.LayerAlert>
                        <S.AlertInfo>
                          <AlertIcon />
                          <S.AlertText
                            variant="body3"
                            component="p"
                          >
                            You are on Mainnet. To use the Boba DAO, SWITCH to Boba
                          </S.AlertText>
                        </S.AlertInfo>
                        <LayerSwitcher isButton={true} />
                      </S.LayerAlert>
                }
              </Box>
              <S.DividerLine />
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
                <Typography variant="body3">At least {proposalThreshold} BOBA + xBOBA are needed to create a new proposal</Typography>
              </Box>
            </S.DaoWalletContainer>
            <S.DaoProposalContainer>
              <ProposalList />
            </S.DaoProposalContainer>
          </S.DaoPageContent>

          {/* {!layer &&
            <S.LayerAlert>
              <S.AlertInfo>
                <AlertIcon />
                <S.AlertText
                  variant="body2"
                  component="p"
                >
                  You have not connected your wallet. To use the Boba DAO, connect to MetaMask
                </S.AlertText>
              </S.AlertInfo>
              <WalletPicker />
            </S.LayerAlert>
          } */}

        </S.DaoPageContainer>
      </div>
    </>)
}

export default React.memo(DAO)
