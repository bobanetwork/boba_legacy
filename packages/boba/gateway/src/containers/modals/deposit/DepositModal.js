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
import { useDispatch } from 'react-redux'

import Modal from 'components/modal/Modal'
import { closeModal } from 'actions/uiAction'

import InputStep from './steps/InputStep'
import TeleportationStepFast from '../teleportation/TeleportationStepFast'
import InputStepMultiChain from './steps/InputStepMultiChain'
import { fetchTransactions } from 'actions/networkAction'
import { BRIDGE_TYPE } from 'util/constant'

function DepositModal({ open, token, fast }) {

  const dispatch = useDispatch()

  function handleClose() {
    dispatch(closeModal('depositModal'))
    dispatch(fetchTransactions())
  }

  return (
    <Modal open={open} maxWidth="md" onClose={handleClose} minHeight={!!fast ? "fit-content" : "500px"}>

      {
        BRIDGE_TYPE.FAST_BRIDGE === fast ? <TeleportationStepFast handleClose={handleClose} token={token}/> : null
      }
      {
        BRIDGE_TYPE.CLASSIC_BRIDGE === fast ? <InputStep handleClose={handleClose} token={token}/> : null
      }
      {
        BRIDGE_TYPE.MULTI_CHAIN_BRIDGE === fast ? <InputStepMultiChain handleClose={handleClose} token={token}/> : null
      }

      {/* {!!fast ? (
          <InputStepFast handleClose={handleClose} token={token}/>
        ) : (
          <InputStep handleClose={handleClose} token={token}/>
      )} */}
    </Modal>
  )
}

export default React.memo(DepositModal)
