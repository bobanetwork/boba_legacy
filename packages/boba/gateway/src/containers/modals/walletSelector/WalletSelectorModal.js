
import React from 'react'
import { useDispatch } from 'react-redux'

import { closeModal } from 'actions/uiAction'
import { setConnectBOBA, setConnectETH, setWalletConnected } from 'actions/setupAction.js'

import Modal from 'components/modal/Modal'

import { Box, Typography } from '@mui/material'
import { Content, BoxCenter } from 'components/modal/Modal.styles'

import networkService from 'services/networkService'

import metaMaskLogo from 'images/metamask.svg'
import walletConnectLogo from 'images/walletconnect.svg'
import { useWalletConnect } from 'hooks/useWalletConnect'
import { setConnect } from 'actions/setupAction'

const WalletSelectorModal = ({ open }) => {

  const { triggerInit } = useWalletConnect()

  const dispatch = useDispatch()

  const connectToWallet = async (type) => {
    const resetConnectChain = () => {
      dispatch(setConnectETH(false))
      dispatch(setConnectBOBA(false))
    }

    try {
      if (await networkService.walletService.connectWallet(type)) {
        dispatch(closeModal('walletSelectorModal'))
        triggerInit();
      } else {
        resetConnectChain()
      }
    } catch (error) {
      console.log(`Error connecting wallet: ${error}`)
      resetConnectChain()
    }
  }

  const handleClose = () => {
    dispatch(closeModal('walletSelectorModal'))
    dispatch(setConnect(false))
    dispatch(setConnectETH(false))
    dispatch(setConnectBOBA(false))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      newStyle={true}
      maxWidth="450px"
      minHeight="200px"
      title="Connect to Wallet"
    >
      <Box>
        <Content>
          <BoxCenter onClick={() => connectToWallet('metamask')}>
            <img src={metaMaskLogo} alt='metamask' height="100"/>
            <Typography variant="body" sx={{fontWeight: 700, mb: 2}}>
              MetaMask
            </Typography>
          </BoxCenter>
          <BoxCenter onClick={() => connectToWallet('walletconnect')}>
            <img src={walletConnectLogo} alt='walletconnect' height="100"/>
            <Typography variant="body" sx={{fontWeight: 700, mb: 2}}>
              WalletConnect
            </Typography>
          </BoxCenter>
        </Content>
      </Box>
    </Modal>
  )
}

export default React.memo(WalletSelectorModal)
