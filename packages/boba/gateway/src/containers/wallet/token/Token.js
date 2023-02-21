import React, { useCallback, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  selectlayer1Balance,
  selectlayer2Balance,
} from 'selectors/balanceSelector'
import { selectLoading } from 'selectors/loadingSelector'
import {
  selectAccountEnabled,
  selectBaseEnabled,
  selectLayer,
} from 'selectors/setupSelector'
import { selectNetwork } from 'selectors/networkSelector'
import { selectTokens } from 'selectors/tokenSelector'
import { selectTransactions } from 'selectors/transactionSelector'

import { fetchLookUpPrice } from 'actions/networkAction'
import { setActiveHistoryTab } from 'actions/uiAction'

import * as S from './Token.styles'
import * as G from '../../Global.styles'

import { Box, Typography, CircularProgress } from '@mui/material'
import { tokenTableHeads } from './token.tableHeads'

import ListToken from 'components/listToken/listToken'
import Button from 'components/button/Button'
import Link from 'components/icons/LinkIcon'
import Pulse from 'components/pulse/PulsingBadge'

import { isEqual, orderBy } from 'lodash'

import networkService from 'services/networkService'

import { useNavigate } from 'react-router-dom'

import Faucet from 'components/faucet/Faucet'
import Connect from '../../connect/Connect'

function TokenPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const accountEnabled = useSelector(selectAccountEnabled())
  const baseEnabled = useSelector(selectBaseEnabled())
  const tokenList = useSelector(selectTokens)

  const l2Balance = useSelector(selectlayer2Balance, isEqual)
  const l1Balance = useSelector(selectlayer1Balance, isEqual)

  const layer = useSelector(selectLayer())
  const network = useSelector(selectNetwork())

  const [debug, setDebug] = useState(false)

  const depositLoading = useSelector(selectLoading(['DEPOSIT/CREATE']))
  const exitLoading = useSelector(selectLoading(['EXIT/CREATE']))
  const balanceLoading = useSelector(selectLoading(['BALANCE/GET']))

  const disabled = depositLoading || exitLoading

  const unorderedTransactions = useSelector(selectTransactions, isEqual)
  const orderedTransactions = orderBy(
    unorderedTransactions,
    (i) => i.timeStamp,
    'desc'
  )

  const pendingL1 = orderedTransactions.filter((i) => {
    if (
      i.chain === 'L1pending' && //use the custom API watcher for fast data on pending L1->L2 TXs
      i.crossDomainMessage &&
      i.crossDomainMessage.crossDomainMessage === 1 &&
      i.crossDomainMessage.crossDomainMessageFinalize === 0 &&
      i.action.status === 'pending'
    ) {
      return true
    }
    return false
  })

  const pendingL2 = orderedTransactions.filter((i) => {
    if (
      i.chain === 'L2' &&
      i.crossDomainMessage &&
      i.crossDomainMessage.crossDomainMessage === 1 &&
      i.crossDomainMessage.crossDomainMessageFinalize === 0 &&
      i.action.status === 'pending'
    ) {
      return true
    }
    return false
  })

  const pending = [...pendingL1, ...pendingL2]

  const inflight = pending.filter((i) => {
    if (
      pending &&
      i.hasOwnProperty('stateRoot') &&
      i.stateRoot.stateRootHash === null
    ) {
      return true
    }
    return false
  })

  useEffect(() => {
    if (!accountEnabled) return
    const gasEstimateAccount = networkService.gasEstimateAccount
    const wAddress = networkService.account
    if (wAddress.toLowerCase() === gasEstimateAccount.toLowerCase()) {
      setDebug(true)
    }
  }, [accountEnabled])

  const getLookupPrice = useCallback(() => {
    if (!accountEnabled) return
    // only run once all the tokens have been added to the tokenList
    if (Object.keys(tokenList).length < networkService.tokenAddresses.length)
      return

    const symbolList = Object.values(tokenList).map((i) => {
      if (i.symbolL1 === 'ETH') {
        return 'ethereum'
      } else if (i.symbolL1 === 'OMG') {
        return 'omg'
      } else if (i.symbolL1 === 'BOBA') {
        return 'boba-network'
      } else if (i.symbolL1 === 'OLO') {
        return 'oolongswap'
      } else if (i.symbolL1 === 'USDC') {
        return 'usd-coin'
      } else if (i.symbolL1 === 'AVAX') {
        return 'avalanche-2'
      } else if (i.symbolL1 === 'FTM') {
        return 'fantom'
      } else if (['BNB', 'tBNB'].includes(i.symbolL1)) {
        return 'binancecoin'
      } else if (['DEV', 'GLMR'].includes(i.symbolL1)) {
        return 'moonbeam'
      } else {
        return i.symbolL1.toLowerCase()
      }
    })
    dispatch(fetchLookUpPrice(symbolList))
  }, [tokenList, dispatch, accountEnabled])

  useEffect(() => {
    if (!baseEnabled) return
    getLookupPrice()
  }, [getLookupPrice, baseEnabled])

  const GasEstimateApprove = () => {
    let approval = networkService.estimateApprove()
    console.log(['Gas Estimate Approval', approval])
  }

  if (!accountEnabled) {
    return (
      <G.Container>
        <G.ContentEmpty>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Connect accountEnabled={accountEnabled} />
          </Box>
        </G.ContentEmpty>
      </G.Container>
    )
  } else {
    return (
      <>
        {layer === 'L2' && network === 'mainnet' && (
          <Box sx={{ padding: '10px 0px', lineHeight: '0.9em' }}>
            <Typography variant="body2">
              <span style={{ opacity: '0.9' }}>Need ETH or BOBA</span>
              {'? '}
              <span style={{ opacity: '0.6' }}>
                You can swap one for the other at{' '}
              </span>
              <G.footerLink
                target="_blank"
                href={'https://www.sushi.com/swap'}
                aria-label="link"
                style={{
                  fontSize: '1.0em',
                  opacity: '0.9',
                  paddingLeft: '3px',
                }}
              >
                Sushiswap
                <Link />
              </G.footerLink>
              <span style={{ opacity: '0.6' }}>and </span>
              <G.footerLink
                target="_blank"
                href={'https://oolongswap.com/'}
                aria-label="link"
                style={{
                  fontSize: '1.0em',
                  opacity: '0.9',
                  paddingLeft: '3px',
                }}
              >
                Oolongswap <Link />
              </G.footerLink>
            </Typography>
            {debug && (
              <Button
                onClick={() => {
                  GasEstimateApprove()
                }}
                color="primary"
                variant="contained"
              >
                GasEstimateApprove
              </Button>
            )}
          </Box>
        )}

        <Faucet />

        {!!accountEnabled && inflight.length > 0 && (
          <Box
            sx={{ padding: '10px 0px', display: 'flex', flexDirection: 'row' }}
          >
            <Typography
              variant="body2"
              sx={{ cursor: 'pointer' }}
              onClick={() => {
                dispatch(setActiveHistoryTab('Pending'))
                navigate('/history')
              }}
            >
              <span style={{ opacity: '0.9' }}>Bridge in progress:</span>{' '}
              <span style={{ opacity: '0.6' }}>Click for detailed status</span>
              <Pulse variant="success" />
            </Typography>
          </Box>
        )}

        <G.Container>
          <G.Content>
            <S.TableHeading>
              {tokenTableHeads.map((item) => {
                return (
                  <S.TableHeadingItem
                    sx={{
                      width: item.size,
                      flex: item.flex,
                      ...item.sx,
                    }}
                    key={item.label}
                    variant="body2"
                    component="div"
                  >
                    {item.label}
                  </S.TableHeadingItem>
                )
              })}
            </S.TableHeading>
            {layer === 'L2' ? (
              !balanceLoading || !!l2Balance.length ? (
                l2Balance.map((i) => {
                  return (
                    <ListToken
                      key={i.currency}
                      token={i}
                      chain={'L2'}
                      networkLayer={layer}
                      disabled={disabled}
                    />
                  )
                })
              ) : (
                <S.LoaderContainer>
                  <CircularProgress color="secondary" />
                </S.LoaderContainer>
              )
            ) : null}
            {layer === 'L1' ? (
              !balanceLoading || !!l1Balance.length ? (
                l1Balance.map((i) => {
                  return (
                    <ListToken
                      key={i.currency}
                      token={i}
                      chain={'L1'}
                      networkLayer={layer}
                      disabled={disabled}
                    />
                  )
                })
              ) : (
                <S.LoaderContainer>
                  <CircularProgress color="secondary" />
                </S.LoaderContainer>
              )
            ) : null}
          </G.Content>
        </G.Container>
      </>
    )
  }
}

export default React.memo(TokenPage)
