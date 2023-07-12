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
import { WrapperActionsModal } from 'components/modal/styles'

import { selectCDMType, selectCDMMessage, selectCDMTransaction } from 'selectors'

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
    title: '',
    message: '',
    buttonText: '',
    buttonLink: `${networkService?.networkConfig?.L2?.blockExplorer}tx/${CDMTransaction?.transactionHash}`
  }

  if (CDMType === 'L1StandardBridge') {

    builder.header = 'Classical Brigde To L2 Successful'
    builder.title = (<>Your <span style={{fontWeight: 700}}>{CDMMessage?.token}</span> has arrived on L2!</>)
    builder.message = 'You can track your transaction in the L2 explorer.'
    builder.buttonText = `Track in L2 Explorer`

  } else if (CDMType === 'L1FastBridge') {

    builder.header = 'Fast Bridge To L2 Successful'
    builder.title = <>Your <span style={{fontWeight: 700}}>{CDMMessage?.token}</span> has arrived on L2!</>
    builder.message = <>You are expected to receive <span style={{fontWeight: 700}}>{CDMMessage?.receivedToken}</span> on L2. You can track your transaction in the L2 explorer.</>
    builder.buttonText = `Track in L2 Explorer`

  } else if (CDMType === 'L2StandardBridge') {

    builder.header = 'Classical Withdrawal Initiated'
    builder.title = <>Your <span style={{fontWeight: 700}}>{CDMMessage?.token}</span> withdrawal has been initiated.</>
    builder.message = <>You will receive <span style={{fontWeight: 700}}>{CDMMessage?.token}</span> on L1 after 7 days</>
    builder.buttonText = `View on L2 Explorer`

  } else if (CDMType === 'L2FastBridge') {
    builder.header = 'Fast Withdrawal Initiated'
    builder.title = <>Your <span style={{fontWeight: 700}}>{CDMMessage?.token}</span> withdrawal has been initiated.</>
    builder.message = <>You are expected to receive <span style={{fontWeight: 700}}>{CDMMessage?.receivedToken}</span> on{" "}
    L1 in next few hours.</>
    builder.buttonText = `View on L2 Explorer`
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      minHeight="200px"
      newStyle={true}
      title={builder.header}
    >
      <Box>
        <Typography variant="body" sx={{mt: 2}}>
          {builder?.title}
        </Typography>
        <Typography variant="body2" sx={{opacity: 0.65}}>
          {builder?.message}
        </Typography>
      </Box>
      <WrapperActionsModal>
        <Button
          onClick={() => openInNewTab(builder?.buttonLink)}
          variant='contained'
          color='primary'
          size='large'
          newStyle
        >
          {builder?.buttonText}
        </Button>
      </WrapperActionsModal>
    </Modal>
  )
}

export default React.memo(CDMCompletionModal)
