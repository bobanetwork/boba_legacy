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
import { openModal } from 'actions/uiAction'
import { Typography } from '@mui/material'
import { useTheme } from '@emotion/react'

import Button from 'components/button/Button'
import ProposalList from './proposal/ProposalList'

import { selectDaoBalance, selectDaoVotes, selectDaoBalanceX, selectDaoVotesX } from 'selectors/daoSelector'
import { selectLayer, selectAccountEnabled } from 'selectors/setupSelector'

import AlertIcon from 'components/icons/AlertIcon'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import WalletPicker from 'components/walletpicker/WalletPicker'
import PageHeader from 'components/pageHeader/PageHeader'

import * as S from './Dao.styles'
import * as styles from './Dao.module.scss'

function DAO() {

    const dispatch = useDispatch()

    const theme = useTheme()
    
    const balance = useSelector(selectDaoBalance)
    const balanceX = useSelector(selectDaoBalanceX)
    const votes = useSelector(selectDaoVotes)
    const votesX = useSelector(selectDaoVotesX)
    let layer = useSelector(selectLayer())
    const accountEnabled = useSelector(selectAccountEnabled())

    return (
        <>
            <PageHeader title="DAO" />

            <div className={styles.container}>

            {layer === 'L1' &&
                <S.LayerAlert>
                  <S.AlertInfo>
                    <AlertIcon />
                    <S.AlertText
                      variant="body2"
                      component="p"
                    >
                      You are on Mainnet. To use the Boba DAO, SWITCH to Boba
                    </S.AlertText>
                  </S.AlertInfo>
                  <LayerSwitcher />
                </S.LayerAlert>
            }
            {!layer &&
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
            }
            <div className={styles.content} style={{background: theme.palette.background.secondary}}>
                <div className={styles.topRow}>
                <div className={styles.transferContainer}>
                    <div className={styles.info} style={{textAlign: 'left', padding: '20px'}}>
                        <Typography variant="h4">Wallet Balances</Typography>
                        <Typography variant="h4" style={{opacity: '0.7', paddingLeft: '60px', fontSize: '0.8em'}}>{Number(balanceX)} xBOBA</Typography>
                        <Typography variant="h4" style={{opacity: '0.7', paddingLeft: '60px', fontSize: '0.8em'}}>{Number(balance)} BOBA</Typography>
                    </div>
                </div>
                <div className={styles.transferContainer}>
                    <div className={styles.info} style={{textAlign: 'left', padding: '20px', paddingBottom: '0px'}}>
                        <Typography variant="h4">Votes</Typography>
                        <Typography variant="h4" style={{opacity: '0.7',paddingLeft: '60px', fontSize: '0.8em'}}>{Number(votesX)} xBOBA</Typography>
                        <Typography variant="h4" style={{opacity: '0.7',paddingLeft: '60px', fontSize: '0.8em'}}>{Number(votes)} BOBA</Typography>
                        <Typography variant="h4" style={{opacity: '0.7',paddingLeft: '60px', fontSize: '0.8em'}}>{Number(votes)+Number(votesX)} Total</Typography>
                    </div>
                </div>
                <div className={styles.transferContainer} style={{paddingTop: '10px'}}>
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={() => {dispatch(openModal('delegateDaoXModal'))}}
                        disabled={!accountEnabled}
                    >
                        Delegate xBOBA
                    </Button>
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={() => {dispatch(openModal('delegateDaoModal'))}}
                        disabled={!accountEnabled}
                    >
                        Delegate BOBA
                    </Button>
                </div> 
                </div>
                    <Typography 
                        variant="body2" 
                        style={{
                          fontSize: '0.7em',
                          margin: '10px',
                          opacity: '0.6',
                          textAlign: 'left', 
                          lineHeight: '1.0em', 
                          //padding: '20px',
                          //paddingTop: 0,
                        }}
                    >
                        To delegate voting authority, select "Delegate Votes". You can delegate to one address at a time. To vote from this account, please delegate your votes to yourself.
                        The number of votes delegated is equal to your balance of BOBA.
                        Votes are delegated until you delegate again (to someone else) or transfer your BOBA.
                    </Typography>
            </div>
            <div className={styles.proposal}>
                <ProposalList/>
            </div>
        </div>
    </>)
}

export default React.memo(DAO)
