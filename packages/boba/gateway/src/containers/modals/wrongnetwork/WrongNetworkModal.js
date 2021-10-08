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

import React from 'react';
import { useDispatch } from 'react-redux'

import Button from 'components/button/Button'
import Modal from 'components/modal/Modal'

import { closeModal } from 'actions/uiAction'

import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import { Box, Typography, useMediaQuery } from '@material-ui/core'
import { ReactComponent as Fox } from './../../../images/icons/fox-icon.svg'
import { ReactComponent as Account } from './../../../images/icons/mm-account.svg'

import { getAllNetworks } from 'util/masterConfig'

import store from 'store'

import networkService from 'services/networkService'

import * as styles from './WrongNetworkModal.module.scss'
import { useTheme } from '@emotion/react'

function WrongNetworkModal ({ open, onClose }) {

  const dispatch = useDispatch()

  const nw = getAllNetworks()
  const masterConfig = store.getState().setup.masterConfig
  const networkLayer = store.getState().setup.netLayer

  /*
    This is fired if the internal setting of the gateway does not match the 
    MetaMask configuration. There are multiple networks (e.g. mainent and rinkeby), 
    and multiple layers, e.g. L1 and L2 
  */

  console.log("WNM masterConfig",masterConfig)
  console.log("WNM networkLayer",networkLayer)

  //Next figure out the right labels and targets

  const textLabel = nw[masterConfig].MM_Label
  const iconLabel = nw[masterConfig].MM_Label

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  function handleClose () {
    onClose()
    dispatch(closeModal('wrongNetworkModal'))
  }

  async function correctChain() {
    await networkService.correctChain( networkLayer )
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      light
      maxWidth="sm"
    >
      <Typography variant="h2" gutterBottom>
        Incorrect Network
      </Typography>

      <Typography variant="body1" style={{margin: 0, padding: 0, paddingTop: '40px'}}>
        To use {textLabel}, please change network.
      </Typography>

      <Button
        onClick={correctChain}
        color='primary'
        size='large'
        variant='contained'
        fullWidth={isMobile}
        newStyle
      >
        Change MetaMask Network
      </Button>

      <Typography variant="body2" style={{margin: 0, padding: 0, paddingTop: '60px'}}>
        Or, you can change manually, by going to MetaMask and 
        clicking in the top bar.
      </Typography>

      <Box display="flex" sx={{ flexDirection: 'column', alignItems: 'center', mt: 3}}>
        <div className={styles.metamask}>
          <Fox width={isMobile ? 30 : 30} />
          <div className={styles.button}>
            {iconLabel}
            <ExpandMoreIcon/>
          </div>
          <Account width={isMobile ? 40 : 40} />
        </div>
        <ArrowUpwardIcon fontSize={'large'} color={'primary'}/>
      </Box>

    </Modal>
  );
}

export default React.memo(WrongNetworkModal)
