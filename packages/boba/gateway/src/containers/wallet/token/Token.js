import React, { useCallback, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { selectlayer1Balance, selectlayer2Balance } from 'selectors/balanceSelector'
import { selectLoading } from 'selectors/loadingSelector'
import { selectAccountEnabled, selectLayer, selectWalletAddress } from 'selectors/setupSelector'
import { selectNetwork } from 'selectors/networkSelector'
import { selectTokens } from 'selectors/tokenSelector'
import { selectTransactions } from 'selectors/transactionSelector'

import { fetchLookUpPrice } from 'actions/networkAction'
import { setActiveHistoryTab } from 'actions/uiAction'

import { openAlert } from 'actions/uiAction'

import * as S from './Token.styles'
import * as G from '../../Global.styles'

import twitter from 'images/twitter.png'

import { Box, Typography, CircularProgress, Input } from '@mui/material'
import { tokenTableHeads } from './token.tableHeads'

import ListToken from 'components/listToken/listToken'
import Button from 'components/button/Button'
import Link from 'components/icons/LinkIcon'
import Pulse from 'components/pulse/PulsingBadge'
import Copy from 'components/copy/Copy'

import { isEqual, orderBy } from 'lodash'

import networkService from 'services/networkService'

import { Md5 } from "ts-md5/dist/md5"
import { useNavigate } from 'react-router-dom'

function TokenPage() {

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const accountEnabled = useSelector(selectAccountEnabled())
  const tokenList = useSelector(selectTokens)
  const networkLayer = useSelector(selectLayer())
  const childBalance = useSelector(selectlayer2Balance, isEqual)
  const rootBalance = useSelector(selectlayer1Balance, isEqual)
  const layer = useSelector(selectLayer())
  const network = useSelector(selectNetwork())
  const walletAddress = useSelector(selectWalletAddress())

  const [ tweetUrl, setTweetUrl ] = useState("")
  const [ isClaimFaucetLoading, setIsClaimFaucetLoading ] = useState(false)
  const [ faucetErrorMsg, setFaucetErrorMsg ] = useState("")

  const [ debug, setDebug ] = useState(false)

  const depositLoading = useSelector(selectLoading([ 'DEPOSIT/CREATE' ]))
  const exitLoading = useSelector(selectLoading([ 'EXIT/CREATE' ]))
  const balanceLoading = useSelector(selectLoading([ 'BALANCE/GET' ]))

  const disabled = depositLoading || exitLoading

  const unorderedTransactions = useSelector(selectTransactions, isEqual)
  const orderedTransactions = orderBy(unorderedTransactions, i => i.timeStamp, 'desc')

  let bobaTag = ''
  if(walletAddress)
    bobaTag = Md5.hashStr(walletAddress.toLowerCase().substring(2))

  let BT = ''
  let tweet = ''
  if (bobaTag) {
    BT = "BOBA" + bobaTag.substring(0, 9).toUpperCase()
    tweet = "https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Boba%20Network%20" + BT
  }

  const pendingL1 = orderedTransactions.filter((i) => {
    if (i.chain === 'L1pending' && //use the custom API watcher for fast data on pending L1->L2 TXs
      i.crossDomainMessage &&
      i.crossDomainMessage.crossDomainMessage === 1 &&
      i.crossDomainMessage.crossDomainMessageFinalize === 0 &&
      i.action.status === "pending"
    ) {
      return true
    }
    return false
  })

  const pendingL2 = orderedTransactions.filter((i) => {
    if (i.chain === 'L2' &&
      i.crossDomainMessage &&
      i.crossDomainMessage.crossDomainMessage === 1 &&
      i.crossDomainMessage.crossDomainMessageFinalize === 0 &&
      i.action.status === "pending"
    ) {
      return true
    }
    return false
  })

  const pending = [
    ...pendingL1,
    ...pendingL2
  ]

  const inflight = pending.filter((i) => {
    if (pending && i.hasOwnProperty('stateRoot') && i.stateRoot.stateRootHash === null) {
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
  }, [ accountEnabled ])

  const getLookupPrice = useCallback(() => {
    if (!accountEnabled) return
    // only run once all the tokens have been added to the tokenList
    if (Object.keys(tokenList).length < 27) return
    const symbolList = Object.values(tokenList).map((i) => {
      if (i.symbolL1 === 'ETH') {
        return 'ethereum'
      } else if (i.symbolL1 === 'OMG') {
        return 'omg'
      } else if(i.symbolL1 === 'BOBA') {
        return 'boba-network'
      } else if(i.symbolL1 === 'OLO') {
        return 'oolongswap'
      } else if(i.symbolL1 === 'USDC') {
        return 'usd-coin'
      } else {
        return i.symbolL1.toLowerCase()
      }
    })
    dispatch(fetchLookUpPrice(symbolList))
  }, [ tokenList, dispatch, accountEnabled ])

  useEffect(() => {
    if (!accountEnabled) return
    getLookupPrice()
  }, [ getLookupPrice, accountEnabled ])

  const GasEstimateApprove = () => {
    let approval = networkService.estimateApprove()
    console.log("GasEstimateApprove:",approval)
  }

  async function claimAuthenticatedFaucetTokens() {
    try {
      setIsClaimFaucetLoading(true)
      const tweetId = tweetUrl?.match(/twitter\.com\/.*\/status\/(\d+)/)[1]
      const res = await networkService.getTestnetETHAuthenticatedMetaTransaction(tweetId)
      if (!res) {
        dispatch(openAlert('Faucet request submitted'))
      } else {
        setFaucetErrorMsg(res)
      }
    } catch (err) {
      let error = err.message.match(/execution reverted: (.*)\\+"}}/)
      if (error) {
        error = error[1]
      } else {
        error = err?.message ?? err
      }
      setFaucetErrorMsg(error)
    } finally {
      setIsClaimFaucetLoading(false)
    }
  }

  if (!accountEnabled) {

    return (
      <G.Container>
        <G.ContentEmpty>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.1204 2.66504C7.51906 2.66504 5.37107 4.63837 5.37107 7.12371V24.8731C5.37107 27.3585 7.51906 29.3318 10.1204 29.3318H21.9551C24.5564 29.3318 26.7044 27.3585 26.7044 24.8731C26.7044 24.0051 26.7044 14.4757 26.7044 11.9984C26.7044 11.9851 26.7044 11.9704 26.7044 11.9571C26.7044 7.20638 22.1191 2.66504 17.3711 2.66504C11.7524 2.66504 11.7391 2.66504 10.1204 2.66504ZM10.1204 5.33171C11.4417 5.33171 12.9364 5.33171 16.0377 5.33171V8.87307C16.0377 11.3584 18.1857 13.3317 20.7871 13.3317H24.0377C24.0377 16.7144 24.0377 24.0944 24.0377 24.8731C24.0377 25.8251 23.1391 26.6651 21.9551 26.6651H10.1204C8.93639 26.6651 8.03773 25.8251 8.03773 24.8731V7.12371C8.03773 6.17171 8.93639 5.33171 10.1204 5.33171ZM18.7044 5.49838C21.0671 6.12505 23.2591 8.30906 23.8711 10.6651H20.7871C19.6017 10.6651 18.7044 9.82507 18.7044 8.87307V5.49838ZM12.0377 10.6651C11.3017 10.6651 10.7044 11.2624 10.7044 11.9984C10.7044 12.7344 11.3017 13.3317 12.0377 13.3317H13.3711C14.1071 13.3317 14.7044 12.7344 14.7044 11.9984C14.7044 11.2624 14.1071 10.6651 13.3711 10.6651H12.0377ZM12.0377 15.9984C11.3017 15.9984 10.7044 16.5957 10.7044 17.3318C10.7044 18.0678 11.3017 18.6651 12.0377 18.6651H20.0377C20.7737 18.6651 21.3711 18.0678 21.3711 17.3318C21.3711 16.5957 20.7737 15.9984 20.0377 15.9984H12.0377ZM12.0377 21.3318C11.3017 21.3318 10.7044 21.9291 10.7044 22.6651C10.7044 23.4011 11.3017 23.9984 12.0377 23.9984H20.0377C20.7737 23.9984 21.3711 23.4011 21.3711 22.6651C21.3711 21.9291 20.7737 21.3318 20.0377 21.3318H12.0377Z" fill="white" fillOpacity="0.65" />
            </svg>
            <Typography variant="body3" sx={{ opacity: 0.65 }}>
              No Data
            </Typography>
          </Box>
        </G.ContentEmpty>
      </G.Container>
    )

  } else {

    return (
    <>
      {layer === 'L2' && network === 'mainnet' &&
        <Box sx={{ padding: '10px 0px', lineHeight: '0.9em' }}>
          <Typography variant="body2">
            <span style={{opacity: '0.9'}}>Need ETH or BOBA</span>{'? '}
            <span style={{opacity: '0.6'}}>You can swap one for the other at </span>
            <G.footerLink
              target='_blank'
              href={'https://www.sushi.com/swap'}
              aria-label="link"
              style={{fontSize: '1.0em', opacity: '0.9', paddingLeft: '3px'}}
            >Sushiswap<Link />
            </G.footerLink>
            <span style={{opacity: '0.6'}}>and </span>
            <G.footerLink
              target='_blank'
              href={'https://oolongswap.com/'}
              aria-label="link"
              style={{fontSize: '1.0em', opacity: '0.9', paddingLeft: '3px'}}
            >Oolongswap <Link />
            </G.footerLink>
          </Typography>
          {debug &&
            <Button
              onClick={()=>{GasEstimateApprove()}}
              color='primary'
              variant="contained"
            >
              GasEstimateApprove
            </Button>
          }
        </Box>
      }

      {layer === 'L2' && network === 'goerli' &&
          <G.LayerAlert style={{padding: '20px'}}>
          <Box>

            <Box style={{display: "inline-block"}}>
              <Typography variant="body2">
                Developer Twitter/Turing test token fountain - your Boba Bubble:{" "}
                <span style={{ opacity: 0.65 }}>{BT} <Copy value={BT} light={false} /></span>
              </Typography>
            </Box>

            <Typography variant="body3" sx={{ opacity: 0.65, marginBottom: "10px" }}>
              Welcome developers.
              For testnet BOBA and ETH, tweet your Boba Bubble and
              then paste the tweet link in the field below.
            </Typography>

            <a
              target='_blank'
              rel="noopener noreferrer"
              href={tweet}
              aria-label="link"
              style={{
                backgroundColor: '#1b95e0',
                color: '#fff',
                borderRadius: '4px',
                height: '28px',
                fontWeight: '500',
                fontSize: '13px',
                lineheight: '26px',
                padding: '8px 8px 8px 30px',
                textDecoration: 'none',
                backgroundImage: `url(${twitter})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px 13px',
                backgroundPosition: '8px 10px'
              }}
            >Tweet Now
            </a>

            <Typography variant="body3" sx={{ opacity: 0.65, marginTop: "10px", marginBottom: "10px" }}>
              For the Tweet link, tap the share icon, tap "Share Tweet via", and finally select "Copy link to Tweet".
            </Typography>

            <Input
              style={{width: '80%'}}
              value={tweetUrl}
              placeholder="Tweet Link"
              onChange={(e) => setTweetUrl(e?.target?.value.split('?')[0])} //remove the superfluous stuff after the "?"
            />

            <Typography variant="body3" sx={{ opacity: 0.65, marginBottom: "10px", marginTop: '3px'}}>
              You are limited to one fountain call per twitter account per day.
              The transaction will not show in your history since it's a MetaTransaction (the gas is covered by Boba).
            </Typography>

            <Button
              type="primary"
              variant="contained"
              style={{ marginTop: "10px", marginBottom: "18px" }}
              disabled={!tweetUrl || !tweetUrl?.includes('http')}
              loading={isClaimFaucetLoading}
              onClick={async (e) => {await claimAuthenticatedFaucetTokens()}}
              size="small"
            >
              Authenticated Faucet
            </Button>

            {faucetErrorMsg ? <Typography style={{color: 'red'}}>{faucetErrorMsg}</Typography> : null}
          </Box>
          </G.LayerAlert>
      }

      {!!accountEnabled && inflight.length > 0 &&
        <Box sx={{ padding: '10px 0px', display: 'flex', flexDirection: 'row' }}>
          <Typography
            variant="body2"
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              dispatch(setActiveHistoryTab("Pending"));
              navigate('/history')
            }}
          >
            <span style={{opacity: '0.9'}}>Bridge in progress:</span>{' '}
            <span style={{opacity: '0.6'}}>Click for detailed status</span>
            <Pulse variant="success"/>
          </Typography>
        </Box>
      }

      <G.Container>
        <G.Content>
          <S.TableHeading>
            {tokenTableHeads.map((item) => {
              return (
                <S.TableHeadingItem
                  sx={{
                    width: item.size,
                    flex: item.flex,
                    ...item.sx
                  }}
                  key={item.label} variant="body2" component="div">{item.label}</S.TableHeadingItem>
              )
            })}
          </S.TableHeading>
          {networkLayer === 'L2' ? !balanceLoading || !!childBalance.length ? childBalance.map((i, index) => {
            return (
              <ListToken
                key={i.currency}
                token={i}
                chain={'L2'}
                networkLayer={networkLayer}
                disabled={disabled}
              />
            )
          }) :
          <S.LoaderContainer>
            <CircularProgress color="secondary" />
          </S.LoaderContainer> : null}
          {networkLayer === 'L1' ? !balanceLoading || !!rootBalance.length ? rootBalance.map((i, index) => {
            return (
              <ListToken
                key={i.currency}
                token={i}
                chain={'L1'}
                networkLayer={networkLayer}
                disabled={disabled}
              />
            )
          }) :
          <S.LoaderContainer>
            <CircularProgress color="secondary" />
          </S.LoaderContainer> : null}
        </G.Content>
      </G.Container>
    </>)
  }

}

export default React.memo(TokenPage)
