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

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { selectModalState } from 'selectors/uiSelector'

import useInterval from 'util/useInterval'

import {
  fetchBalances,
  fetchGas,
  addTokenList,
  fetchExits
} from 'actions/networkAction'

import networkService from 'services/networkService'

import { setBaseState } from 'actions/setupAction'
import { selectBaseEnabled, selectAccountEnabled, selectNetwork, selectLayer } from 'selectors/setupSelector'

/**** ACTIONS and SELECTORS *****/

import { checkVersion } from 'actions/serviceAction'
import { closeAlert, closeError } from 'actions/uiAction'
import { selectAlert, selectError } from 'selectors/uiSelector'

import DepositModal from 'containers/modals/deposit/DepositModal'
import DepositBatchModal from 'containers/modals/deposit/DepositBatchModal'
import TransferModal from 'containers/modals/transfer/TransferModal'
import ExitModal from 'containers/modals/exit/ExitModal'

import AddTokenModal from 'containers/modals/addtoken/AddTokenModal'

import FarmWrapper from 'containers/farm/FarmWrapper'
import FarmDepositModal from 'containers/modals/farm/FarmDepositModal'
import FarmWithdrawModal from 'containers/modals/farm/FarmWithdrawModal'

import SaveWrapper from 'containers/save/SaveWrapper'
import SaveDepositModal from 'containers/modals/save/SaveDepositModal'

import DAO from 'containers/dao/Dao'
import TransferDaoModal from 'containers/modals/dao/TransferDaoModal'
import DelegateDaoModal from 'containers/modals/dao/DelegateDaoModal'
import DelegateDaoXModal from 'containers/modals/dao/DelegateDaoXModal'
import NewProposalModal from 'containers/modals/dao/NewProposalModal'

import {
  fetchDaoBalance,
  fetchDaoVotes,
  fetchDaoBalanceX,
  fetchDaoVotesX,
  fetchDaoProposals,
  getProposalThreshold
} from 'actions/daoAction'

import { fetchAirdropStatusL1, fetchAirdropStatusL2 } from 'actions/airdropAction'
import { getFS_Saves, getFS_Info } from 'actions/fixedAction'
import { fetchVerifierStatus } from 'actions/verifierAction'

import Airdrop from 'containers/airdrop/Airdrop'
import Account from 'containers/account/Account'
import Transactions from 'containers/transactions/History'
import BobaScope from 'containers/bobaScope/BobaScope'
import Help from 'containers/help/Help'
import NFT from 'containers/nft/Nft'
import Ecosystem from 'containers/ecosystem/Ecosystem'

import { Box, Container } from '@mui/material'

import MainMenu from 'components/mainMenu/MainMenu'
import PageFooter from 'components/pageFooter/PageFooter'

import Alert from 'components/alert/Alert'

import { POLL_INTERVAL } from 'util/constant'

function Home() {

  const dispatch = useDispatch()

  const errorMessage = useSelector(selectError)
  const alertMessage = useSelector(selectAlert)

  const [ mobileMenuOpen ] = useState(false)

  const pageDisplay = useSelector(selectModalState('page'))
  const depositModalState = useSelector(selectModalState('depositModal'))
  const depositBatchModalState = useSelector(selectModalState('depositBatchModal'))
  const transferModalState = useSelector(selectModalState('transferModal'))
  const exitModalState = useSelector(selectModalState('exitModal'))

  const fast = useSelector(selectModalState('fast'))
  const token = useSelector(selectModalState('token'))

  const addTokenModalState = useSelector(selectModalState('addNewTokenModal'))
  const saveDepositModalState = useSelector(selectModalState('saveDepositModal'))

  const farmDepositModalState = useSelector(selectModalState('farmDepositModal'))
  const farmWithdrawModalState = useSelector(selectModalState('farmWithdrawModal'))

  const tranferBobaDaoModalState = useSelector(selectModalState('transferDaoModal'))
  const delegateBobaDaoModalState = useSelector(selectModalState('delegateDaoModal'))
  const delegateBobaDaoXModalState = useSelector(selectModalState('delegateDaoXModal'))
  const proposalBobaDaoModalState = useSelector(selectModalState('newProposalModal'))

  const network = useSelector(selectNetwork())
  const layer = useSelector(selectLayer())
  const baseEnabled = useSelector(selectBaseEnabled())
  const accountEnabled = useSelector(selectAccountEnabled())

  const handleErrorClose = () => dispatch(closeError())
  const handleAlertClose = () => dispatch(closeAlert())

  useEffect(() => {
    const body = document.getElementsByTagName('body')[ 0 ];
    mobileMenuOpen
      ? body.style.overflow = 'hidden'
      : body.style.overflow = 'auto';
  }, [ mobileMenuOpen ]);

  // calls only on boot
  useEffect(() => {
    window.scrollTo(0, 0)

    if(!baseEnabled) initializeBase()

    async function initializeBase() {
      console.log("Calling initializeBase for", network)
      const initialized = await networkService.initializeBase( network )
      if (!initialized) {
        console.log("Failed to boot L1 and L2 base providers for", network)
        dispatch(setBaseState(false))
        return false
      }
      if (initialized === 'enabled') {
        console.log("Network Base Providers are up")
        dispatch(setBaseState(true))
        // load DAO to speed up the process
        dispatch(fetchDaoProposals())
        return true
      }
    }

  }, [ dispatch, network, baseEnabled ])

  useInterval(() => {
    if(accountEnabled /*== MetaMask is connected*/) {
      dispatch(fetchBalances()) // account specific
      dispatch(fetchAirdropStatusL1()) // account specific
      dispatch(fetchAirdropStatusL2()) // account specific
      dispatch(fetchDaoBalance())      // account specific
      dispatch(fetchDaoVotes())        // account specific
      dispatch(fetchDaoBalanceX())     // account specific
      dispatch(fetchDaoVotesX())       // account specific
      dispatch(fetchExits())           // account specific
      dispatch(getFS_Saves())          // account specific
      dispatch(getFS_Info())           // account specific
    }
    if(baseEnabled /*== we have Base L1 and L2 providers*/) {
      dispatch(fetchGas())
      dispatch(fetchVerifierStatus())
      dispatch(getProposalThreshold())
      dispatch(fetchDaoProposals())
    }
  }, POLL_INTERVAL)

  useEffect(() => {
    // load the following functions when the home page is open
    checkVersion()
    dispatch(fetchGas())
    dispatch(fetchVerifierStatus())
    dispatch(getProposalThreshold())
  }, [dispatch])

  useEffect(() => {
    if (accountEnabled) {
      dispatch(addTokenList())
    }
  }, [ dispatch, accountEnabled ])

  console.log("Home - account enabled:", accountEnabled, "layer:", layer, "Base enabled:", baseEnabled)

  return (
    <>
      {!!depositModalState && <DepositModal  open={depositModalState}  token={token} fast={fast} />}
      {!!depositBatchModalState && <DepositBatchModal  open={depositBatchModalState} />}

      {!!transferModalState && <TransferModal open={transferModalState} token={token} fast={fast} />}
      {!!exitModalState && <ExitModal open={exitModalState} token={token} fast={fast} />}

      {!!addTokenModalState && <AddTokenModal open={addTokenModalState} />}

      {!!saveDepositModalState && <SaveDepositModal open={saveDepositModalState} />}

      {!!farmDepositModalState && <FarmDepositModal open={farmDepositModalState} />}
      {!!farmWithdrawModalState && <FarmWithdrawModal open={farmWithdrawModalState} />}

      {!!tranferBobaDaoModalState && <TransferDaoModal open={tranferBobaDaoModalState} />}
      {!!delegateBobaDaoModalState && <DelegateDaoModal open={delegateBobaDaoModalState} />}
      {!!delegateBobaDaoXModalState && <DelegateDaoXModal open={delegateBobaDaoXModalState} />}
      {!!proposalBobaDaoModalState && <NewProposalModal open={proposalBobaDaoModalState} />}

      <Alert
        type='error'
        duration={0}
        open={!!errorMessage}
        onClose={handleErrorClose}
        position={50}
      >
        {errorMessage}
      </Alert>

      <Alert
        type='success'
        duration={0}
        open={!!alertMessage}
        onClose={handleAlertClose}
        position={0}
      >
        {alertMessage}
      </Alert>

      <Box sx={{ display: 'flex',height: '100%', flexDirection: 'column', width: '100%' }}>
        <MainMenu />
        <Container maxWidth={false} sx={{
          height: 'calc(100% - 150px)',
          minHeight: '500px',
          marginLeft: 'unset',
          width: '100vw',
          marginRight: 'unset'
        }}>
          {pageDisplay === "AccountNow" &&
            <Account />
          }
          {pageDisplay === "History" &&
            <Transactions />
          }
          {pageDisplay === "BobaScope" &&
            <BobaScope />
          }
          {pageDisplay === "NFT" &&
            <NFT />
          }
          {pageDisplay === "Farm" &&
            <FarmWrapper />
          }
          {pageDisplay === "Save" &&
            <SaveWrapper />
          }
          {pageDisplay === "DAO" &&
            <DAO />
          }
          {pageDisplay === "Airdrop" &&
            <Airdrop />
          }
          {pageDisplay === "Help" &&
            <Help />
          }
          {pageDisplay === "Ecosystem" &&
            <Ecosystem/>
          }
        </Container>
        <PageFooter/>
      </Box>
    </>
  )
}

export default React.memo(Home)
