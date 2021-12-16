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
import { Box, Typography } from '@material-ui/core'
import { useTheme } from '@emotion/react'

import Button from 'components/button/Button'
import ProposalList from './proposal/ProposalList'

import { selectDaoBalance, selectDaoVotes } from 'selectors/daoSelector'
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
    const votes = useSelector(selectDaoVotes)
    
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
                            <div className={styles.info}>
                                <Typography variant="h3">{balance} Boba</Typography>
                                <Typography variant="h4">Wallet Balance</Typography>
                                <Typography variant="body2" className={styles.helpText} style={{textAlign: 'left'}}>
                                    To transfer Boba to another wallet, select "Transfer".
                                </Typography>
                            </div>
                            <Button
                                color="primary"
                                variant="contained"
                                fullWidth={true}
                                onClick={()=>{dispatch(openModal('transferDaoModal'))}}
                            >Transfer</Button>
                        </div>
                        <div className={styles.delegateContainer} 
                            style={{background: theme.palette.background.secondary}}
                        >
                            <div className={styles.info}>
                                <Typography variant="h3">{votes} Votes</Typography>
                                <Typography variant="h4">Voting Power</Typography>
                                <Typography variant="body2" className={styles.helpText}>
                                    To delegate voting authority, select "Delegate Votes". 
                                </Typography>
                            </div> 
                            <Button
                                color="primary"
                                variant="contained"
                                fullWidth={true}
                                onClick={() => {dispatch(openModal('delegateDaoModal'))}}
                            >
                                Delegate Votes
                            </Button>
                            <div className={styles.info}>
                            <Typography variant="body2" className={styles.helpTextLight} style={{textAlign: 'left', fontSize: '0.7em', lineHeight: '1.0em'}}>
                                You can delegate to one address at a time.
                                To vote from this account, please delegate your votes to yourself.
                                The number of votes delegated is equal to your balance of BOBA.
                                Votes are delegated until you delegate again (to someone else) or transfer your BOBA.
                            </Typography>
                            </div>
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
