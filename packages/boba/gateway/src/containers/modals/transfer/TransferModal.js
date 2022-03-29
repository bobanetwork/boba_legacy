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

import { transfer } from 'actions/networkAction'
import { closeModal, openAlert } from 'actions/uiAction'
import { selectLoading } from 'selectors/loadingSelector'
import { selectLookupPrice } from 'selectors/lookupSelector'

import BN from 'bignumber.js'

import { Box, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@emotion/react'

import Button from 'components/button/Button'
import Modal from 'components/modal/Modal'
import Input from 'components/input/Input'

import { amountToUsd, logAmount, toWei_String } from 'util/amountConvert'
import networkService from 'services/networkService'

import { WrapperActionsModal } from 'components/modal/Modal.styles'

function TransferModal ({ open, token, minHeight }) {

  const dispatch = useDispatch()

  const [ value, setValue ] = useState('')
  const [ value_Wei_String, setValue_Wei_String ] = useState('0')  //support for Use Max

  const [ recipient, setRecipient ] = useState('')

  const [ validValue, setValidValue ] = useState(false)

  const loading = useSelector(selectLoading([ 'TRANSFER/CREATE' ]))
  const wAddress = networkService.account ? networkService.account : ''

  const lookupPrice = useSelector(selectLookupPrice)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  let maxValue = '0'

  if(token) {
    maxValue = logAmount(token.balance, token.decimals)
  }

  function setAmount(value) {

    const tooSmall = new BN(value).lte(new BN(0.0))
    const tooBig   = new BN(value).gt(new BN(maxValue))

    if (tooSmall || tooBig) {
      setValidValue(false)
    } else {
      setValidValue(true)
    }

    setValue(value)
  }

  async function submit () {
    if ( token.address && recipient )
    {
      try {
        console.log("Amount to transfer:", value_Wei_String)
        const transferResponseGood = await dispatch(
          transfer(recipient, value_Wei_String, token.address)
        )
        if (transferResponseGood) {
          dispatch(openAlert('Transaction submitted'))
        }
        handleClose()
      } catch (err) {
        //guess not really?
      }
    }
  }

  function handleClose () {
    setValue('')
    setValue_Wei_String('0')
    setRecipient('')
    dispatch(closeModal('transferModal'))
  }

  //checked
  let convertToUSD = false
  if( Object.keys(lookupPrice) &&
      !!value &&
      validValue &&
      !!amountToUsd(value, lookupPrice, token)
  ) {
    convertToUSD = true
  }

  return (
    <Modal open={open} onClose={handleClose} maxWidth="md" minHeight="500px">
      <Box>
        <Typography variant="h2" sx={{fontWeight: 700, mb: 2}}>
          Transfer to another Boba wallet
        </Typography>

        <Typography variant="body1" sx={{mb: 1}}>
          From L2 Address: {wAddress}
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

          <Input
            label="Amount to Transfer"
            placeholder=""
            value={value}
            type="number"
            onChange={(i)=>{
              setAmount(i.target.value)
              setValue_Wei_String(toWei_String(i.target.value, token.decimals))
            }}
            onUseMax={(i)=>{       // they want to use the maximum
              setAmount(maxValue)  // so the input value updates for the user
              setValue_Wei_String(token.balance.toString())
            }}
            allowUseAll={true}
            unit={token.symbol}
            maxValue={maxValue}
            variant="standard"
            newStyle
          />
        </Box>

        {convertToUSD && (
          <Typography variant="body2" component="p" sx={{opacity: 0.5, mt: 2}}>
            {`Value in USD: $${amountToUsd(value, lookupPrice, token).toFixed(2)}`}
          </Typography>
        )}

        <Typography variant="body2" sx={{mt: 2, fontWeight: '700', color: 'red'}}>
          CAUTION: This function is only for transfers from one Boba wallet to another Boba wallet.
          You cannot directly transfer funds from a Boba wallet to an L1 address or to another chain. 
          Your funds will be lost if you try to do so.
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
            onClick={() => {submit({useLedgerSign: false})}}
            color='primary'
            variant="contained"
            loading={loading}
            tooltip={loading ? "Your transaction is still pending. Please wait for confirmation." : "Click here to transfer your funds to another Boba wallet"}
            disabled={!validValue}
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

export default React.memo(TransferModal)
