import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Button from 'components/button/Button'

import { Info } from '@mui/icons-material'
import { Box, Checkbox, FormControlLabel, Icon, Typography } from '@mui/material'

import { getETHMetaTransaction } from 'actions/setupAction'
import { openAlert, openError } from 'actions/uiAction'
import { fetchTransactions } from 'actions/networkAction'

import Tabs from 'components/tabs/Tabs'
import Nft from 'containers/wallet/nft/Nft'
import Token from './token/Token'

import * as S from './wallet.styles'
import * as G from '../Global.styles'

import { setConnectETH, setConnectBOBA } from 'actions/setupAction'

import { selectAccountEnabled, selectLayer } from 'selectors/setupSelector'

import { selectlayer2Balance } from 'selectors/balanceSelector'

import { isEqual } from 'util/lodash';

import { DEFAULT_NETWORK, LAYER, POLL_INTERVAL } from 'util/constant'
import useInterval from 'hooks/useInterval'

import BN from 'bignumber.js'
import { logAmount } from 'util/amountConvert.js'
import {
  selectActiveNetwork,
  selectActiveNetworkName,
} from 'selectors/networkSelector'
import networkService from 'services/networkService'
import { NETWORK } from 'util/network/network.util'
import Connect from "../connect/Connect";
import PageTitle from "../../components/pageTitle/PageTitle";

function Wallet() {
  const [page, setPage] = useState('Token')
  const [tooSmallSec, setTooSmallSec] = useState(false)
  const [tooSmallBOBA, setTooSmallBOBA] = useState(false)
  const [ balanceToken, setBalanceToken ] = useState(false);

  const dispatch = useDispatch()
  const network = useSelector(selectActiveNetwork())
  const layer = useSelector(selectLayer())
  const accountEnabled = useSelector(selectAccountEnabled())
  const networkName = useSelector(selectActiveNetworkName())
  // low balance warnings
  const l2Balances = useSelector(selectlayer2Balance, isEqual)

  // fetching transactions
  useEffect(() => {
    if (accountEnabled) dispatch(fetchTransactions())
  }, [dispatch, accountEnabled])

  useInterval(() => {
    if (accountEnabled) {
      dispatch(fetchTransactions())
    }
  }, POLL_INTERVAL)

  useEffect(() => {
    if (accountEnabled && l2Balances.length > 0) {
      const l2BalanceSec = l2Balances.find(
        (i) => i.symbol === networkService.L1NativeTokenSymbol
      )
      const l2BalanceBOBA = l2Balances.find((i) => i.symbol === 'BOBA')

      if (l2BalanceSec && l2BalanceSec.balance) {
        // FOR ETH MIN BALANCE 0.003ETH for other sec tokens 1
        const minBalance = network === NETWORK.ETHEREUM ? 0.003 : 1
        setTooSmallSec(
          new BN(logAmount(l2BalanceSec.balance, 18)).lt(new BN(minBalance))
        )
      } else {
        // in case of zero ETH balance we are setting tooSmallSec
        setTooSmallSec(true)
      }
      if (l2BalanceBOBA && l2BalanceBOBA.balance) {
        // FOR BOBA MIN BALANCE of 1
        setTooSmallBOBA(
          new BN(logAmount(l2BalanceBOBA.balance, 18)).lt(new BN(1))
        )
      } else {
        // in case of zero BOBA balance we are setting tooSmallBOBA
        setTooSmallBOBA(true)
      }
    }
  }, [l2Balances, accountEnabled, network])

  useEffect(() => {
    if (layer === 'L2') {
      if (tooSmallBOBA && tooSmallSec) {
        dispatch(
          openError(
            `Wallet empty - please bridge in ${networkService.L1NativeTokenSymbol} or BOBA from L1`
          )
        )
      }
    }
  }, [tooSmallSec, tooSmallBOBA, layer, dispatch])

  async function emergencySwap() {
    const res = await dispatch(getETHMetaTransaction())
    if (res) {
      dispatch(openAlert('Emergency Swap submitted'))
    }
  }

  return (
    <S.PageContainer>
      <PageTitle title={'Wallet'} />
      <Connect
        userPrompt={'Connect to MetaMask to see your balances, transfer, and bridge'}
        accountEnabled={accountEnabled}
      />
      {layer === 'L2' && tooSmallSec && (
        <G.LayerAlert style={{ padding: '20px' }}>
          <G.AlertInfo>
            <Icon as={Info} sx={{ color: '#FFD88D' }} />
            <Typography
              flex={4}
              variant="body2"
              component="p"
              ml={2}
              style={{ opacity: '0.6' }}
            >
              Using {networkService.L1NativeTokenSymbol} requires a minimum BOBA
              balance (of 1 BOBA) regardless of your fee setting, otherwise
              MetaMask may incorrectly reject transactions. If you ran out of
              BOBA, use EMERGENCY SWAP to swap{' '}
              {networkService.L1NativeTokenSymbol} for 1 BOBA at market rates.
            </Typography>
          </G.AlertInfo>

          <Button
            onClick={() => {
              emergencySwap()
            }}
            color="primary"
            variant="outlined"
          >
            EMERGENCY SWAP
          </Button>
        </G.LayerAlert>
      )}

      {accountEnabled ? (
        <>
          <S.WalletActionContainer>
            <G.PageSwitcher>
              <Typography
                className={layer === LAYER.L1 ? 'active' : ''}
                onClick={() => {
                  if (!!accountEnabled) {
                    dispatch(setConnectETH(true))
                  }
                }}
                variant="body2"
                component="span"
              >
                {networkName[ 'l1' ] || DEFAULT_NETWORK.NAME.L1} Wallet
              </Typography>
              <Typography
                className={layer === LAYER.L2 ? 'active' : ''}
                onClick={() => {
                  if (!!accountEnabled) {
                    dispatch(setConnectBOBA(true))
                  }
                }}
                variant="body2"
                component="span"
              >
                {networkName[ 'l2' ] || DEFAULT_NETWORK.NAME.L2} Wallet
              </Typography>
            </G.PageSwitcher>
            <FormControlLabel
              control={
                <Checkbox
                  checked={balanceToken}
                  onChange={e => setBalanceToken(e.target.checked)}
                  name="my tokens only"
                  color="primary"
                />
              }
              label="My tokens only"
            />
          </S.WalletActionContainer>
          {network === NETWORK.ETHEREUM ? (
            <>
              <Box sx={{ mt: 2 }}>
                <Tabs
                  activeTab={page}
                  onClick={(t) => setPage(t)}
                  aria-label="Page Tab"
                  tabs={[ 'Token', 'NFT' ]}
                />
              </Box>
              {page === 'Token' ? <Token balanceToken={balanceToken} /> : <Nft />}
            </>
          ) : (
            <Token balanceToken={balanceToken} />
          )}
        </>
      ) : ('')}


    </S.PageContainer>
  )
}

export default React.memo(Wallet)
