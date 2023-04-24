import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectActiveNetworkType, selectLayer, selectWalletAddress  } from 'selectors';

import * as G from 'containers/Global.styles'
import { Box, Typography, Input } from '@mui/material';

import faucetService from 'services/faucet.service';
import { openAlert } from 'actions/uiAction';
import { NETWORK_TYPE } from 'util/network/network.util';
import Copy from 'components/copy/Copy';
import Button from 'components/button/Button';
import twitter from 'images/twitter.png'
import { Md5 } from 'ts-md5';
import networkService from 'services/networkService';


/**
 * @Faucet
 *  - only accessible on L2 for testnet env.
 */

const Faucet = (props) => {

  const dispatch = useDispatch();
  const activeNetworkType = useSelector(selectActiveNetworkType());
  const layer = useSelector(selectLayer())
  const walletAddress = useSelector(selectWalletAddress())


  const [ tweetUrl, setTweetUrl ] = useState("")
  const [ isClaimFaucetLoading, setIsClaimFaucetLoading ] = useState(false)
  const [ faucetErrorMsg, setFaucetErrorMsg ] = useState("")

  let bobaTag = ''
  if (walletAddress)
    bobaTag = Md5.hashStr(walletAddress.toLowerCase().substring(2))

  let BT = ''
  let tweet = ''
  if (bobaTag) {
    BT = "BOBA" + bobaTag.substring(0, 9).toUpperCase()
    tweet = networkService.networkConfig.twitterFaucetPromotionText + BT
  }

  async function claimAuthenticatedFaucetTokens() {
    try {
      setIsClaimFaucetLoading(true)
      const tweetId = tweetUrl?.match(/twitter\.com\/.*\/status\/(\d+)/)[ 1 ]
      const res = await faucetService.getTestnetETHAuthenticatedMetaTransaction(tweetId)
      if (!res) {
        dispatch(openAlert('Faucet request submitted'))
      } else {
        setFaucetErrorMsg(res)
      }
    } catch (err) {
      let error = err.message.match(/execution reverted: (.*)\\+"}}/)
      if (error) {
        error = error[ 1 ]
      } else {
        error = err?.message ?? err
      }
      setFaucetErrorMsg(error)
    } finally {
      setIsClaimFaucetLoading(false)
    }
  }

  if (layer === 'L2' &&
    activeNetworkType === NETWORK_TYPE.TESTNET)
  {
    return (
      <G.LayerAlert style={{ padding: '20px' }}>
        <Box>
          <Box style={{ display: "inline-block" }}>
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
            style={{ width: '80%' }}
            value={tweetUrl}
            placeholder="Tweet Link"
            onChange={(e) => setTweetUrl(e?.target?.value.split('?')[ 0 ])} //remove the superfluous stuff after the "?"
          />

          <Typography variant="body3" sx={{ opacity: 0.65, marginBottom: "10px", marginTop: '3px' }}>
            You are limited to one fountain call per twitter account per day.
            The transaction will not show in your history since it's a MetaTransaction (the gas is covered by Boba).
          </Typography>

          <Button
            type="primary"
            variant="contained"
            style={{ marginTop: "10px", marginBottom: "18px" }}
            disabled={!tweetUrl || !tweetUrl?.includes('http')}
            loading={isClaimFaucetLoading}
            onClick={async (e) => { await claimAuthenticatedFaucetTokens() }}
            size="small"
          >
            Authenticated Faucet
          </Button>

          {faucetErrorMsg ? <Typography style={{ color: 'red' }}>{faucetErrorMsg}</Typography> : null}
        </Box>
      </G.LayerAlert>
    )
  }

  return null;
}

export default Faucet;
