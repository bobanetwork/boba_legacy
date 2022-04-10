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

import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { transfer } from 'actions/networkAction'
import { closeModal, openAlert } from 'actions/uiAction'
import { selectLoading } from 'selectors/loadingSelector'
import { selectLookupPrice } from 'selectors/lookupSelector'

import { BigNumber, utils } from 'ethers'

import {
   selectBobaFeeChoice,
   selectBobaPriceRatio,
} from 'selectors/setupSelector'

import BN from 'bignumber.js'

import { Box, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@emotion/react'

import Button from 'components/button/Button'
import Modal from 'components/modal/Modal'
import Input from 'components/input/Input'

import { amountToUsd, toWei_String } from 'util/amountConvert'

import networkService from 'services/networkService'

import { WrapperActionsModal } from 'components/modal/Modal.styles'

function TransferModal ({ open, token, minHeight }) {

  const dispatch = useDispatch()

  const [ value, setValue ] = useState('')
  const [ value_Wei_String, setValue_Wei_String ] = useState('0')  // support for Use Max - amount to transfer in wei_string
  const [ max_Wei_String, setMax_Wei_String ] = useState('0')      // support for Use Max - the max possible wei string
  const [ max_Float, setMax_Float ] = useState('0')                // support for Use Max - a number like 0.09 ETH
  const [ fee, setFee ] = useState('0')

  const [ recipient, setRecipient ] = useState('')
  const [ validValue, setValidValue ] = useState(false)

  const loading = useSelector(selectLoading([ 'TRANSFER/CREATE' ]))

  const lookupPrice = useSelector(selectLookupPrice)

  const feeUseBoba = useSelector(selectBobaFeeChoice())
  const feePriceRatio = useSelector(selectBobaPriceRatio())

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  useEffect(() => {

    async function estimateCost() {
      
      let cost_BN = await networkService.transferEstimate(recipient, token.balance.toString(), token.address)
      
      //sigh - convert from BN.js to ethers.BigNumber
      let max_BN = BigNumber.from(token.balance.toString()) 

      // both ETH and BOBA have 18 decimals so this is safe
      if(token.symbol === 'ETH') {
        // we are transferring ETH and paying in either token
        // since MetaMask does not know about BOBA, we need to subtract the ETH fee 
        // regardless of how we are paying, otherwise will get an error in MetaMask 
        max_BN = max_BN.sub(cost_BN)
      } 
      else if (token.symbol === 'BOBA' && feeUseBoba) {
        // we are transferring BOBA and paying in BOBA
        // so need to subtract the BOBA fee
        max_BN = max_BN.sub(cost_BN.mul(BigNumber.from(feePriceRatio)))
      }
      
      // if the transferrable amount is less than the gas, 
      // set the transferrable amount to zero
      if(max_BN.lt(BigNumber.from('0'))) {
        max_BN = BigNumber.from('0')
      }

      setMax_Wei_String(max_BN.toString())
      setMax_Float(utils.formatUnits(max_BN, token.decimals))

      // display the correct Fee amount to the user
      if(feeUseBoba) cost_BN = cost_BN.mul(BigNumber.from(feePriceRatio)) 
      setFee(utils.formatUnits(cost_BN, token.decimals))
    }
    if (recipient !== '') estimateCost()
  }, [token, feeUseBoba, recipient, feePriceRatio])

  function setAmount(value) {

    const tooSmall = new BN(value).lte(new BN(0.0))
    const tooBig   = new BN(value).gt(new BN(max_Float))

    if (tooSmall || tooBig) {
      setValidValue(false)
    } 
    else if (!recipient) {
      setValidValue(false)
    } 
    else {
      setValidValue(true)
    }

    setValue(value)
  }

  async function submit () {
    if ( token.address && recipient )
    {
      const res = await dispatch(
        transfer(recipient, value_Wei_String, token.address)
      )
      if (res) dispatch(openAlert('Transfer submitted'))
      handleClose()
    }
  }

  function handleClose () {
    setValue('')
    setValue_Wei_String('0')
    setRecipient('')
    setMax_Wei_String('0')
    setMax_Float('0')
    setFee('0')
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

        <Box sx={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <Input
            placeholder='Recipient address on Boba (0x...)'
            value={recipient}
            onChange={i => setRecipient(i.target.value)}
            fullWidth
            paste
            sx={{fontSize: '50px'}}
            newStyle
          />

        {!!recipient &&
          <Input
            label="Amount to Transfer"
            placeholder=""
            value={value}
            type="number"
            onChange={(i)=>{
              setAmount(i.target.value)
              setValue_Wei_String(toWei_String(i.target.value, token.decimals))
            }}
            onUseMax={(i)=>{        // they want to use the maximum
              setAmount(max_Float)  // so the input value updates for the user
              setValue_Wei_String(max_Wei_String)
            }}
            allowUseAll={true}
            unit={token.symbol}
            maxValue={max_Float}
            variant="standard"
            newStyle
          />
        }
        </Box>

        {fee && !feeUseBoba && (
          <Typography variant="body2" component="p" sx={{opacity: 0.5, mt: 2}}>
            Fee: {fee} ETH
          </Typography>
        )}

        {fee && feeUseBoba && (
          <Typography variant="body2" component="p" sx={{opacity: 0.5, mt: 2}}>
            Fee: {fee} BOBA
          </Typography>
        )}

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
            onClick={()=>{submit()}}
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
