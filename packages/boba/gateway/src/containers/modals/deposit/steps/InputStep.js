
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { depositErc20, depositETHL2 } from 'actions/networkAction'
import { setActiveHistoryTab, openModal } from 'actions/uiAction'
import { setCDMCompletion } from 'actions/transactionAction'

import Button from 'components/button/Button'
import Input from 'components/input/Input'

import { selectLoading, selectLookupPrice, selectActiveNetworkName } from 'selectors'
import { amountToUsd, logAmount, toWei_String } from 'util/amountConvert'

import { useTheme } from '@emotion/react'
import { Box, Checkbox, FormControlLabel, Typography, useMediaQuery } from '@mui/material'
import { WrapperActionsModal } from 'components/modal/Modal.styles'

import BN from 'bignumber.js'
import { ethers } from 'ethers'
import BridgeAlert from './BridgeAlert'

function InputStep({ handleClose, token, isBridge, openTokenPicker }) {

  const theme = useTheme()
  const dispatch = useDispatch()

  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [ enableToL2Account, setEnableToL2Account ] = useState(false);
  const [ recipient, setRecipient ] = useState('');
  const [ value, setValue ] = useState('')
  const [ value_Wei_String, setValue_Wei_String ] = useState('0')  //support for Use Max

  const [ validValue, setValidValue ] = useState(false)
  const depositLoading = useSelector(selectLoading([ 'DEPOSIT/CREATE' ]))

  const networkName = useSelector(selectActiveNetworkName())
  const lookupPrice = useSelector(selectLookupPrice)

  const maxValue = logAmount(token.balance, token.decimals)

  function setAmount(value) {

    const tooSmall = new BN(value).lte(new BN(0.0))
    const tooBig = new BN(value).gt(new BN(maxValue))

    if (tooSmall || tooBig) {
      setValidValue(false)
    } else {
      setValidValue(true)
    }

    setValue(value)
  }

  async function doDeposit() {

    let receipt
    let toL2Account = enableToL2Account ? recipient : '';

    // TO check for ETH
    if (token.address === ethers.constants.AddressZero) {
      receipt = await dispatch(
        depositETHL2({
          recipient: toL2Account,
          value_Wei_String
        })
      )
    } else {
      receipt = await dispatch(
        depositErc20({
          recipient: toL2Account,
          value_Wei_String,
          currency: token.address,
          currencyL2: token.addressL2,
        })
      )
    }
    if (receipt) {
      dispatch(setCDMCompletion({
        CDMType: 'L1StandardBridge',
        CDMMessage: { token: `${ethers.utils.formatUnits(value_Wei_String, token.decimals)} ${token.symbol}` },
        CDMTransaction: receipt
      }))
      dispatch(openModal('CDMCompletionModal'))
      dispatch(setActiveHistoryTab(`${networkName[ 'l1' ]} to ${networkName[ 'l2' ]}`))
      handleClose()
    }

  }

  let buttonLabel_1 = 'Cancel'
  if (depositLoading) buttonLabel_1 = 'Close'

  let convertToUSD = false

  if (Object.keys(lookupPrice) &&
    !!value &&
    validValue &&
    !!amountToUsd(value, lookupPrice, token)
  ) {
    convertToUSD = true
  }

  if (Number(logAmount(token.balance, token.decimals)) === 0) {
    //no token in this account
    return (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700, my: 1, color: 'yellow' }}>
          Sorry, nothing to deposit - no {token.symbol} in this wallet
        </Typography>
        <WrapperActionsModal>
          <Button
            onClick={handleClose}
            disabled={false}
            variant='contained'
            color='primary'
            size='large'
          >
            Cancel
          </Button>
        </WrapperActionsModal>
      </Box>)
  }

  return (
    <>
      <Box>
        {!isBridge &&
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
            Classic Bridge {token && token.symbol ? token.symbol : ''} to L2
          </Typography>
        }
        <Input
          label="Amount to bridge to L2"
          placeholder="0.0"
          value={value}
          type="number"
          onChange={(i) => {
            setAmount(i.target.value)
            setValue_Wei_String(toWei_String(i.target.value, token.decimals))
          }}
          onUseMax={(i) => {//they want to use the maximum
            setAmount(maxValue) //so the input value updates for the user - just for display purposes
            setValue_Wei_String(token.balance.toString()) //this is the one that matters
          }}
          allowUseAll={true}
          unit={token.symbol}
          maxValue={maxValue}
          variant="standard"
          newStyle
          isBridge={isBridge}
          openTokenPicker={openTokenPicker}
        />

        <FormControlLabel
          variant="body2"
          control={
            <Checkbox
              checked={enableToL2Account}
              onChange={(e) => setEnableToL2Account(e.target.checked)}
              name="L2Account"
              color="primary"
            />
          }
          label="Enable Deposit to other L2 Account"
        />

        {!!enableToL2Account &&
          <Input
            placeholder='Recipient address on L2 (0x...)'
            value={recipient}
            onChange={i => setRecipient(i.target.value)}
            fullWidth
            paste
            sx={{ fontSize: '50px' }}
            newStyle
          />}

        {!!convertToUSD && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            {`Amount in USD ${amountToUsd(value, lookupPrice, token).toFixed(2)}`}
          </Typography>
        )}

        {!!token && token.symbol === 'OMG' && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            NOTE: The OMG Token was minted in 2017 and it does not conform to the ERC20 token standard.
            In some cases, three interactions with MetaMask are needed. If you are bridging out of a
            new wallet, it starts out with a 0 approval, and therefore, only two interactions with
            MetaMask will be needed.
          </Typography>
        )}

      </Box>
      <WrapperActionsModal>
        <Button
          onClick={handleClose}
          disabled={depositLoading}
          variant='outlined'
          color='primary'
          size='large'
        >
          {buttonLabel_1}
        </Button>
        <Button
          onClick={doDeposit}
          color='primary'
          size="large"
          variant="contained"
          loading={depositLoading}
          tooltip={depositLoading ? "Your transaction is still pending. Please wait for confirmation." : "Click here to bridge your funds to L2"}
          disabled={!validValue}
          triggerTime={new Date()}
          fullWidth={isMobile}
        >
          Bridge
        </Button>
      </WrapperActionsModal>
    </>
  )
}

export default React.memo(InputStep)
