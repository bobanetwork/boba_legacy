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

import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { transferNFT } from 'actions/networkAction'
import { closeModal, openAlert } from 'actions/uiAction'
import { selectLoading } from 'selectors/loadingSelector'

import { Box, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@emotion/react'

import Button from 'components/button/Button'
import Modal from 'components/modal/Modal'
import Input from 'components/input/Input'

import { WrapperActionsModal } from 'components/modal/Modal.styles'

function TransferNFTModal ({ open, token, minHeight }) {

  const dispatch = useDispatch()

  const [ recipient, setRecipient ] = useState('')

  const loading = useSelector(selectLoading([ 'TRANSFER/CREATE' ]))

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  async function submit () {
    if ( token.address && recipient )
    {
      const transferResponseGood = await dispatch(
        transferNFT(recipient, token)
      )
      if (transferResponseGood) dispatch(openAlert('NFT transfer submitted'))
      handleClose()
    }
  }

  function handleClose () {
    setRecipient('')
    dispatch(closeModal('transferNFTModal'))
  }

  return (
    <Modal open={open} onClose={handleClose} maxWidth="md" minHeight="500px">
      <Box>
        <Typography variant="h2" sx={{fontWeight: 700, mb: 2}}>
          Transfer an NFT to another Boba wallet
        </Typography>

        <Typography variant="body1" sx={{mb: 1}}>
          To L2 Address:
        </Typography>

        <Box sx={{display: 'flex', flexDirection: 'column'}}>
          <Input
            placeholder='Recipient address on Boba (0x...)'
            value={recipient}
            onChange={i => setRecipient(i.target.value)}
            fullWidth
            paste
            sx={{fontSize: '50px', marginBottom: '20px'}}
          />

        </Box>

        <Typography variant="body2" sx={{mt: 2, fontWeight: '700', color: 'red'}}>
          CAUTION: This function is only for transfering an NFT from one Boba wallet to another Boba wallet.
          You cannot directly transfer an NFT from a Boba wallet to an L1 address or to another chain. 
          Your NFT will be lost if you try to do so. You can bridge NFTs to other chains on NFT marketplaces 
          that support bridging.
        </Typography>

      </Box>
      <WrapperActionsModal>
        {!isMobile ? (
          <Button
            onClick={handleClose}
            color="neutral"
            size="large"
          >
            Cancel
          </Button>
        ) : null}
          <Button
            onClick={() => {submit()}}
            color='primary'
            variant="contained"
            loading={loading}
            tooltip={loading ? "Your transaction is still pending. Please wait for confirmation." : "Click here to transfer your NFT to another Boba wallet"}
            disabled={!recipient}
            triggerTime={new Date()}
            fullWidth={isMobile}
            size="large"
          >
            Transfer to another Boba wallet
          </Button>
      </WrapperActionsModal>
    </Modal>
  );
}

export default React.memo(TransferNFTModal)
