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
import { Typography } from '@material-ui/core'
import { useTheme } from '@emotion/react'

import Button from 'components/button/Button'
import ProposalList from './proposal/ProposalList'

import { selectDaoBalance, selectDaoVotes, selectDaoBalanceX, selectDaoVotesX } from 'selectors/daoSelector'
import { selectLayer } from 'selectors/setupSelector'

import AlertIcon from 'components/icons/AlertIcon'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import PageHeader from 'components/pageHeader/PageHeader'

import networkService from 'services/networkService'

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

    if (networkService.L1orL2 !== layer) {
        //networkService.L1orL2 is always right...
        layer = networkService.L1orL2
    }

    if(layer === 'L1') {
        return <div className={styles.container}>
            <PageHeader title="DAO" />
            <S.LayerAlert>
              <S.AlertInfo>
                <AlertIcon />
                <S.AlertText
                  variant="body2"
                  component="p"
                >
                  You are on Ethereum Mainnet. To use the Boba DAO, SWITCH to Boba
                </S.AlertText>
              </S.AlertInfo>
              <LayerSwitcher isButton={true} />
            </S.LayerAlert>
        </div>
    }

    return (
        <>
            <PageHeader title="DAO" />

            <div className={styles.container}>

                <div className={styles.content}>
                        <div className={styles.transferContainer}
                            style={{background: theme.palette.background.secondary }}
                        >
                            <div className={styles.info} style={{textAlign: 'left', padding: '20px'}}>
                                <Typography variant="h3">Wallet Balances</Typography>
                                <Typography variant="h4" style={{opacity: '0.7', paddingLeft: '200px'}}>{Number(balanceX)} xBOBA</Typography>
                                <Typography variant="h4" style={{opacity: '0.7', paddingLeft: '200px'}}>{Number(balance)} BOBA</Typography>
                            </div>
                        </div>
                        <div className={styles.delegateContainer} 
                            style={{background: theme.palette.background.secondary}}
                        >
                            <div className={styles.info} style={{textAlign: 'left', padding: '20px', paddingBottom: '0px'}}>
                                <Typography variant="h3">Votes</Typography>
                                <Typography variant="h4" style={{opacity: '0.7',paddingLeft: '200px'}}>{Number(votesX)} xBOBA</Typography>
                                <Typography variant="h4" style={{opacity: '0.7',paddingLeft: '200px'}}>{Number(votes)} BOBA</Typography>
                                <Typography variant="h4" style={{opacity: '0.7',paddingLeft: '200px'}}>{Number(votes)+Number(votesX)} Total</Typography>
                                <Typography variant="body2" className={styles.helpText}>
                                    To delegate voting authority, select "Delegate Votes". 
                                </Typography>
                            </div>
                            <div style={{    
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-around',
                            }}>
                                <Button
                                    color="primary"
                                    variant="contained"
                                    onClick={() => {dispatch(openModal('delegateDaoXModal'))}}
                                >
                                    Delegate xBOBA Votes
                                </Button>
                                <Button
                                    color="primary"
                                    variant="contained"
                                    onClick={() => {dispatch(openModal('delegateDaoModal'))}}
                                >
                                    Delegate BOBA Votes
                                </Button>
                            </div> 
                            <Typography 
                                variant="body2" 
                                style={{
                                  fontSize: '0.7em',
                                  margin: '10px',
                                  opacity: '0.6',
                                  textAlign: 'left', 
                                  lineHeight: '1.0em', 
                                  padding: '20px',
                                  paddingTop: 0,
                                }}
                            >
                                You can delegate to one address at a time.
                                To vote from this account, please delegate your votes to yourself.
                                The number of votes delegated is equal to your balance of BOBA.
                                Votes are delegated until you delegate again (to someone else) or transfer your BOBA.
                            </Typography>
                    </div>
                </div>
                <div className={styles.proposal}>
                    <ProposalList/>
                </div>
            </div>
        </>
    
    )
}

export default React.memo(DAO)
