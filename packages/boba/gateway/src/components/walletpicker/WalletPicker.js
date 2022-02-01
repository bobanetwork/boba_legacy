/*
Copyright 2021 OMG/BOBA

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import { Box, useMediaQuery } from '@material-ui/core'
import { useTheme } from '@material-ui/core/styles'
import { setEnableAccount, setLayer } from 'actions/setupAction'
import Button from 'components/button/Button'
import WalletAddress from 'components/walletAddress/WalletAddress'
import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectAccountEnabled, selectJustSwitchedChain, selectNetwork } from 'selectors/setupSelector'
import networkService from 'services/networkService'

function WalletPicker() {

  const dispatch = useDispatch()

  const network = useSelector(selectNetwork())
  const accountEnabled = useSelector(selectAccountEnabled())
  const justSwitchedChain = useSelector(selectJustSwitchedChain())

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const dispatchBootAccount = useCallback(() => {

    console.log("Calling initializeAccount for:", network)

    if (!accountEnabled) initializeAccount()

    async function initializeAccount() {

      const initialized = await networkService.initializeAccount(network)

      if (initialized === false) {
        console.log("WP: Account NOT enabled for", network, accountEnabled)
        dispatch(setEnableAccount(false))
        return false
      }

      if (initialized === 'L1' || initialized === 'L2') {
        console.log("WP: Account IS enabled for", initialized)
        dispatch(setLayer(initialized))
        dispatch(setEnableAccount(true))
        return true
      }
    }

  }, [ dispatch, accountEnabled, network ])

  useEffect(() => {
    // auto connect to MM if we just switched chains
    if (justSwitchedChain) dispatchBootAccount()
  }, [ justSwitchedChain, dispatchBootAccount ])

  return (
    <>
    {accountEnabled !== true &&
      <Button
        type="primary"
        variant="contained"
        size='small'
        disabled={accountEnabled}
        onClick={() => dispatchBootAccount()}
      >
        Connect To Metamask
      </Button>
    }
    {accountEnabled &&
      <Box sx={{display: isMobile ? "none" : "flex"}}>
        <WalletAddress/>
      </Box>
    }
    </>
  )
}

export default React.memo(WalletPicker)
