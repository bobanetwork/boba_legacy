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
import { useDispatch } from 'react-redux'

import Modal from 'components/modal/Modal'
import { closeModal } from 'actions/uiAction'

import InputStepBatch from './steps/InputStepBatch'
import { fetchTransactions } from 'actions/networkAction'

function DepositBatchModal({ open }) {

  const dispatch = useDispatch()

  function handleClose() {
    dispatch(closeModal('depositBatchModal'))
    dispatch(fetchTransactions())
  }

  return (
    <Modal open={open} maxWidth="md" onClose={handleClose} minHeight="500px">
      <InputStepBatch handleClose={handleClose}/>
    </Modal>
  )
}

export default React.memo(DepositBatchModal)
