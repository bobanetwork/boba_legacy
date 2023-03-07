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
import { useDispatch, useSelector } from 'react-redux'
import { Box, Typography } from '@mui/material'

import { closeModal } from 'actions/uiAction'
import { resetCDMCompletion } from 'actions/transactionAction'

import Modal from 'components/modal/Modal'
import Button from 'components/button/Button'
import { WrapperActionsModal } from 'components/modal/Modal.styles'

import { selectCDMType, selectCDMMessage, selectCDMTransaction } from 'selectors/transactionSelector'

import networkService from 'services/networkService'

function CDMCompletionModal({ open }) {
  const dispatch = useDispatch()
  const CDMType = useSelector(selectCDMType)
  const CDMMessage = useSelector(selectCDMMessage)
  const CDMTransaction = useSelector(selectCDMTransaction)

  function handleClose () {
    dispatch(closeModal('CDMCompletionModal'))
    dispatch(resetCDMCompletion())
  }

  const openInNewTab = url => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const builder = {
    header: '',
    message: '',
    buttonText: '',
    buttonLink: `${networkService?.networkConfig?.L2?.blockExplorer}tx/${CDMTransaction?.transactionHash}`
  }
  if (CDMType === 'L1StandardBridge') {
    builder.header = 'Classical Brigde To L2 Successful'
    builder.message = (
      <span>Your <span style={{fontWeight: 700}}>{CDMMessage?.token}</span> has arrived on L2!{" "}
      You can track your transaction in the L2 explorer.</span>
    )
    builder.buttonText = `Track in L2 Explorer`
  } else if (CDMType === 'L1FastBridge') {
    builder.header = 'Fast Bridge To L2 Successful'
    builder.message = (
      <span>Your <span style={{fontWeight: 700}}>{CDMMessage?.token}</span> has arrived on L2!{" "}
      You are expected to receive <span style={{fontWeight: 700}}>{CDMMessage?.receivedToken}</span>{" "}
      on L2. You can track your transaction in the L2 explorer.</span>
    )
    builder.buttonText = `Track in L2 Explorer`
  } else if (CDMType === 'L2StandardBridge') {
    builder.header = 'Classical Withdrawal Initiated'
    builder.message = (
      <span>Your <span style={{fontWeight: 700}}>{CDMMessage?.token}</span> withdrawal has been initiated.{" "}
      You will receive <span style={{fontWeight: 700}}>{CDMMessage?.token}</span> on L1 after 7 days.</span>
    )
    builder.buttonText = `View on L2 Explorer`
  } else if (CDMType === 'L2FastBridge') {
    builder.header = 'Fast Withdrawal Initiated'
    builder.message = (
      <span>Your <span style={{fontWeight: 700}}>{CDMMessage?.token}</span> withdrawal has been initiated.{" "}
      You are expected to receive <span style={{fontWeight: 700}}>{CDMMessage?.receivedToken}</span> on{" "}
      L1 in next few hours.
      </span>
    )
    builder.buttonText = `View on L2 Explorer`
  }

  return (
    <Modal open={open} onClose={handleClose} maxWidth="md" minHeight="None">
      <Box>

        <Typography variant="h2" sx={{fontWeight: 700, mb: 2}}>
          {builder?.header}
        </Typography>

        <Typography variant="body1" sx={{mt: 2, fontWeight: '500'}}>
          {builder?.message}
        </Typography>

      </Box>
      <WrapperActionsModal>
        <Button
          onClick={() => openInNewTab(builder?.buttonLink)}
          variant='outlined'
          color='primary'
          size='large'
        >
          {builder?.buttonText}
        </Button>
      </WrapperActionsModal>
    </Modal>
  )
}

export default React.memo(CDMCompletionModal)
