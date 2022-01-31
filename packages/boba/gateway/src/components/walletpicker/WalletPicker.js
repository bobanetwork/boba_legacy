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

import React, { useCallback, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Button from 'components/button/Button'
import Typography from '@material-ui/core/Typography'

import networkService from 'services/networkService'
import { isChangingChain } from 'util/changeChain'

import { selectModalState } from 'selectors/uiSelector'
import { selectNetwork, selectAccountEnabled, selectJustSwitchedChain } from 'selectors/setupSelector'

import { openModal } from 'actions/uiAction'
import { setEnableAccount, setLayer } from 'actions/setupAction'

function WalletPicker() {

  const dispatch = useDispatch()

  const network = useSelector(selectNetwork())
  const accountEnabled = useSelector(selectAccountEnabled())
  const justSwitchedChain = useSelector(selectJustSwitchedChain())

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

  }, [ dispatch, accountEnabled ])

  useEffect(() => {
    // auto connect to MM if we just switched chains
    if (justSwitchedChain) dispatchBootAccount()
  }, [justSwitchedChain])

  return (
      <Button
        type="primary"
        variant="contained"
        size='small'
        disabled={accountEnabled}
        onClick={() => dispatchBootAccount()}
      >
        Connect To Metamask
      </Button>
  )
}

export default React.memo(WalletPicker)
