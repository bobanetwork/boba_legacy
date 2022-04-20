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
import { useTheme } from '@emotion/react'

import { Box, Typography, useMediaQuery } from '@mui/material'

import { depositL1LPBatch, approveFastDepositBatch } from 'actions/networkAction'
import { utils } from 'ethers'

import { openAlert, openError, setActiveHistoryTab } from 'actions/uiAction'

import Button from 'components/button/Button'
import Input from 'components/input/Input'
import CounterButton from 'components/counterButton/CounterButton'

import { WrapperActionsModal } from 'components/modal/Modal.styles'

import { selectLoading } from 'selectors/loadingSelector'
import { selectSignatureStatus_depositLP } from 'selectors/signatureSelector'

import networkService from 'services/networkService'

import parse from 'html-react-parser'

import {
  fetchL2TotalFeeRate,
  fetchL1FeeBalance,
  fetchUserAndL2LPBalanceBatch,
  fetchFastDepositBatchCost,
 } from 'actions/balanceAction'

import {
  selectlayer1Balance,
  selectFastDepositBatchCost,
  selectL1FeeBalance,
  selectUserAndL2LPBalanceBatch,
} from 'selectors/balanceSelector'

function InputStepBatch({ isBridge, handleClose }) {

  const dispatch = useDispatch()

  const [ payload, setPayload ] = useState([{}])
  const [ tokenList, setTokenList ] = useState([])

  const userBalance = useSelector(selectlayer1Balance)
  const batchInfo = useSelector(selectUserAndL2LPBalanceBatch)

  const batchCost = useSelector(selectFastDepositBatchCost)
  const feeBalance = useSelector(selectL1FeeBalance) //amount of ETH on L1 to pay gas

  const depositLoading = useSelector(selectLoading(['DEPOSIT/CREATE']))
  const approvalLoading = useSelector(selectLoading(['APPROVE/CREATE']))

  const signatureStatus = useSelector(selectSignatureStatus_depositLP)

  // console.log("ETH available for paying fees:",Number(feeBalance))
  async function doDeposit() {

    console.log(`User input payload: `, payload)
    let updatedPayload = []
    for (const tokenInput of payload) {
      const tokenBalance = userBalance.filter(i => i.symbol === tokenInput.symbol)
      if (tokenBalance.length === 0) {
        dispatch(openError('Failed to build appropriate payload'))
      } else {
        updatedPayload.push({...tokenInput, ...tokenBalance[0]})
      }
    }

    console.log(`Updated payload: `, updatedPayload)

    let res
    res = await dispatch(
      approveFastDepositBatch(updatedPayload)
    )

    if(res === false) {
      dispatch(openError('Failed to approve amount or user rejected signature'))
      handleClose()
      return
    }

    res = await dispatch(
      depositL1LPBatch(updatedPayload)
    )

    if (res) {
      dispatch(setActiveHistoryTab('Bridge to L2'))
      dispatch(
        openAlert(
          `Your funds were bridged to the L1LP in batch.`
        )
      )
      handleClose()
    }
  }

  useEffect(() => {
      dispatch(fetchL2TotalFeeRate())
      dispatch(fetchL1FeeBalance()) //ETH balance for paying gas
      return ()=>{
        dispatch({type: 'BALANCE/L2/RESET'})
      }
  }, [ dispatch ])

  useEffect(() => {
    dispatch(fetchUserAndL2LPBalanceBatch(tokenList))
    dispatch(fetchFastDepositBatchCost(tokenList))
  }, [ tokenList, dispatch ])


  useEffect(() => {
    if (signatureStatus && depositLoading) {
      //we are all set - can close the window
      //transaction has been sent and signed
      handleClose()
    }
  }, [ signatureStatus, depositLoading, handleClose ])

  function getOptions() {
    const selectTokens = Object.keys(payload).reduce((acc, cur) => {
      acc.push(payload[cur].symbol)
      return acc
    }, [])
    const effectTokens = userBalance.reduce((acc, cur) => {
      acc.push(cur.symbol)
      return acc
    }, [])
    return ['ETH', ...networkService.supportedTokens].reduce((acc, cur) => {
      if (cur !== 'xBOBA' && !selectTokens.includes(cur) && effectTokens.includes(cur)) {
        acc.push(cur)
      }
      return acc
    },[])
  }

  let buttonLabel_1 = 'Cancel'
  if( depositLoading || approvalLoading ) buttonLabel_1 = 'CLOSE WINDOW'

  let buttonLabel_2 = 'Bridge'

  if(depositLoading) {
    buttonLabel_2 = "Bridging..."
  } else if (approvalLoading) {
    buttonLabel_2 = "Approving..."
  }

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  let ETHstring = ''
  let warning = false
  let validInput = true

  // Make sure user have enough ETH to cover the cost and ETH amount
  // that they want to transfer
  const filterETH = payload.filter(i => i.symbol === 'ETH')
  if (filterETH.length === 1) {
    // There should be only one input for ETH
    const payloadETH = filterETH[0]
    if (Number(payloadETH.value) + Number(batchCost) > Number(feeBalance)) {
        warning = true
        validInput = false
        ETHstring = `<br/>WARNING: your L1 ETH balance of ${Number(feeBalance).toFixed(4)} is not sufficient to cover this transaction.
        <br/>THIS TRANSACTION WILL FAIL.`
    }
    else if ((Number(payloadETH.value) + Number(batchCost)) > Number(feeBalance) * 0.96) {
      warning = true
      ETHstring = `<br/>CAUTION: your L1 ETH balance of ${Number(feeBalance).toFixed(4)} is very close to the estimated total.
      <br/>THIS TRANSACTION MIGHT FAIL.`
    }
  } else if (filterETH.length > 1) {
    // Disable the bridge button
    validInput = false
  } else {
    if(Number(batchCost) > Number(feeBalance)) {
      warning = true
      ETHstring = `<br/>WARNING: your L1 ETH balance of ${Number(feeBalance).toFixed(4)} is not sufficient to cover the estimated gas.
      <br/>THIS TRANSACTION WILL FAIL.`
    }
    else if(Number(batchCost) > Number(feeBalance) * 0.96) {
      warning = true
      validInput = false
      ETHstring = `<br/>CAUTION: your L1 ETH balance of ${Number(feeBalance).toFixed(4)} is very close to the estimated cost.
      <br/>THIS TRANSACTION MIGHT FAIL. It would be safer to have slightly more ETH in your L1 wallet to cover gas.`
    }
  }

  // Make sure all input value is correct
  for (const tokenInput of payload) {
    const tokenBalance = userBalance.filter(i => i.symbol === tokenInput.symbol)
    // the token is not selected or the value is not provided
    if (!tokenInput.symbol || !tokenInput.value) {
      validInput = false
    }
    // the value should be larger than 0
    else if (Number(tokenInput.value) <= 0) {
      validInput = false
    }
    // the balance should cover the amount
    else if (tokenBalance.length === 1 &&
      Number(utils.parseUnits(tokenBalance[0].balance.toString(), tokenBalance[0].decimals).toString()) < tokenInput.value
    ) {
      validInput = false
    }
    else if (tokenBalance.length === 0) {
      validInput = false
    }
    // the pool should have the liquidity to cover the value
    else {
      if (batchInfo[tokenInput.symbol]) {
        const LPBalance = batchInfo[tokenInput.symbol].l2LPBalance
        const LPRatio = batchInfo[tokenInput.symbol].LPRatio
        if (
          (Number(LPRatio) < 0.10 && Number(tokenInput.value) > Number(LPBalance) * 0.90) ||
          (Number(LPRatio) < 0.10 && Number(tokenInput.value) <= Number(LPBalance) * 0.90) ||
          (Number(LPRatio) >= 0.10 && Number(tokenInput.value) > Number(LPBalance) * 0.90)
        ) {
          validInput = false
        }
      }
      // We don't get the batch information
      else {
        validInput = false
      }
    }
  }

  return (
    <>
      <Box>
        {!isBridge &&
          <Typography variant="h2" sx={{fontWeight: 700, mb: 1}}>
            Batch Bridge to Boba
          </Typography>
        }

        {payload.map((_, index) => {
          let maxValue = 0, LPRatio = 1, LPBalance = Infinity
          if (payload[index].symbol && batchInfo[payload[index].symbol]) {
            maxValue = batchInfo[payload[index].symbol].balance
            LPRatio = batchInfo[payload[index].symbol].LPRatio
            LPBalance = batchInfo[payload[index].symbol].l2LPBalance
          }
          return (
            <div key={index}>
              <Box style={{display: 'flex'}}>
                <Input
                  label={`Amount to bridge`}
                  placeholder="0"
                  value={payload[index] ? payload[index].value ? payload[index].value : '' : ''}
                  type="number"
                  onChange={(i)=> {
                    const updatedPayload = [...payload]
                    updatedPayload[index] = { ...updatedPayload[index], value: i.target.value }
                    setPayload(updatedPayload)
                  }}
                  onUseMax={(i)=>{//they want to use the maximum
                    const updatedPayload = [...payload]
                    updatedPayload[index] = { ...updatedPayload[index], value: maxValue }
                    setPayload(updatedPayload)
                  }}
                  onSelect={(i) => {
                    // Update payload
                    const updatedPayload = [...payload]
                    updatedPayload[index] = { ...updatedPayload[index], symbol: i.value }
                    setPayload(updatedPayload)
                    // Update token list
                    setTokenList(updatedPayload.reduce((acc, cur) => {acc.push(cur.symbol); return acc}, []))
                  }}
                  allowUseAll={true}
                  unit={payload[index] ? payload[index].symbol ? payload[index].symbol : 'BOBA' : 'BOBA'}
                  maxValue={maxValue}
                  variant="standard"
                  newStyle
                  selectOptions={getOptions()}
                  selectValue={payload[index].symbol ? payload[index].symbol: ''}
                  style={{width: '100%'}}
                />
                <div key={index} style={{display: 'flex', marginTop: payload[index].symbol === 'ETH' ? '0px':'10px', flexDirection: 'column'}}>
                  <CounterButton plus
                    onClick={() => {
                      const updatedPayload = [...payload]
                      updatedPayload.push({})
                      setPayload(updatedPayload)
                    }}
                    disabled={payload.length > 3}
                  />
                  <CounterButton minus
                    onClick={() => {
                      let updatedPayload = [...payload]
                      updatedPayload.splice(index, 1)
                      setPayload(updatedPayload)
                      // Update token list
                      setTokenList(updatedPayload.reduce((acc, cur) => {
                        if (typeof cur.symbol !== 'undefined') {acc.push(cur.symbol)}; return acc
                      }, []))
                    }}
                    disabled={payload.length === 1}
                  />
                </div>
              </Box>

              {payload[index].symbol === 'OMG' &&
                <Typography variant="body2" sx={{mt: 2}}>
                  The OMG Token was minted in 2017 and it does not conform to the ERC20 token standard.
                  In some cases, three interactions with MetaMask are needed.
                </Typography>
              }

              {(Number(LPRatio) < 0.10 && Number(payload[index].value) > Number(LPBalance) * 0.90) && (
                <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
                  The {payload[index].symbol} pool's balance and balance/liquidity ratio are low.
                  Please use the classic bridge.
                </Typography>
              )}

              {(Number(LPRatio) < 0.10 && Number(payload[index].value) <= Number(LPBalance) * 0.90) && (
                <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
                  The {payload[index].symbol} pool's balance/liquidity ratio (of {Number(LPRatio).toFixed(2)}) is too low.
                  Please use the classic bridge.
                </Typography>
              )}

              {(Number(LPRatio) >= 0.10 && Number(payload[index].value) > Number(LPBalance) * 0.90) && (
                <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
                  The {payload[index].symbol} pool's balance (of {Number(LPBalance).toFixed(2)} including inflight bridges) is too low.
                  Please use the classic bridge or reduce the amount.
                </Typography>
              )}
              <br />
            </div>
          )
        })}

        <Typography variant="body2" sx={{mb: 3}}>
        Click the + symbol to add additional tokens to bridge.
        <br/>
        Est. time: less than 10 minutes to 3 hours.  
        </Typography>

        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div style={{flexDirection: 'column'}}>
            <Typography variant="body2" sx={{mb: 0}}>Est. total fee</Typography>
            {batchCost === 0 ? <></>: <Typography variant="body2" sx={{mb: 1}}>{Number(batchCost).toFixed(5)} ETH</Typography>}
          </div>
          <div style={{flexDirection: 'column'}}>
            <Typography variant="body2" sx={{mb: 1}}>Est. bridge fee</Typography>
            {payload.map((_, index) => {
              let l2LPFeeRate = 0.1
              if (payload[index].symbol && batchInfo[payload[index].symbol]) {
                l2LPFeeRate = batchInfo[payload[index].symbol].l2LPFeeRate
              }
              if (payload[index].symbol) {
                return (
                  <Typography variant="body2" sx={{mb: 0}} key={index}>
                    {`${((payload[index].value ? payload[index].value: 0) * l2LPFeeRate / 100).toFixed(3)} ${payload[index].symbol} (${l2LPFeeRate}%)`}
                  </Typography>
                )
              }
              return <></>
            })}
          </div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
            <Typography variant="body2" sx={{mb: 1}}>Est. receive</Typography>
            {payload.map((_, index) => {
              let l2LPFeeRate = 0.1
              if (payload[index].symbol && batchInfo[payload[index].symbol]) {
                l2LPFeeRate = batchInfo[payload[index].symbol].l2LPFeeRate
              }
              if (payload[index].symbol) {
                return (
                  <Typography variant="body2" sx={{mb: 0}} key={index}>
                    {`${((payload[index].value ? payload[index].value * (1 - l2LPFeeRate / 100): 0)).toFixed(3)} ${payload[index].symbol} `}
                  </Typography>
                )
              }
              return <></>
            })}
          </div>
        </div>

        {warning && (
          <Typography variant="body2" sx={{mt: 2, color: 'red'}}>
            {parse(ETHstring)}
          </Typography>
        )}

        {(depositLoading || approvalLoading) && (
          <Typography variant="body2" sx={{mt: 2, color: 'green'}}>
            This window will automatically close when your transaction has been signed and submitted.
          </Typography>
        )}
      </Box>

      <WrapperActionsModal>
        <Button
          onClick={handleClose}
          disabled={false}
          variant='outlined'
          color='primary'
          size='large'
        >
          {buttonLabel_1}
        </Button>
        <Button
          onClick={doDeposit}
          color='primary'
          variant="contained"
          loading={depositLoading || approvalLoading}
          tooltip={depositLoading ? "Your transaction is still pending. Please wait for confirmation." : "Click here to bridge your funds to L2"}
          disabled={!validInput}
          triggerTime={new Date()}
          size="large"
          fullWidth={isMobile}
          newStyle
        >
          {buttonLabel_2}
        </Button>
      </WrapperActionsModal>
    </>
  )
}

export default React.memo(InputStepBatch)
