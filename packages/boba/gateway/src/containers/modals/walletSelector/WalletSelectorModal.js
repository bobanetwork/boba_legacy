
import React from 'react'
import { useDispatch } from 'react-redux'

import { closeModal } from 'actions/uiAction'
import {
  setConnectBOBA,
  setConnectETH,
} from 'actions/setupAction.js'

import Modal from 'components/modal/Modal'
import { Typography } from 'components/global/typography'
import { Svg } from 'components/global/svg'
import networkService from 'services/networkService'
import metaMaskLogo from 'images/metamask.svg'
import walletConnectLogo from 'images/walletconnect.svg'
import ArrowIcon from 'images/icons/arrowright.svg'

import { Wallets, Wallet, Icon, ArrowContainer, IconContainer } from './styles'

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
      title="Connect Wallet"
    >
      <Wallets>
        <Wallet onClick={() => connectToWallet('metamask')}>
          <IconContainer>
            <Icon src={metaMaskLogo} alt="metamask" />
          </IconContainer>
          <Typography variant="title">MetaMask</Typography>
          <ArrowContainer>
            <Svg fill="#fff" src={ArrowIcon} />
          </ArrowContainer>
        </Wallet>
        <Wallet onClick={() => connectToWallet('walletconnect')}>
          <IconContainer>
            <Icon src={walletConnectLogo} alt="walletconnect" />
          </IconContainer>
          <Typography variant="title">WalletConnect</Typography>
          <ArrowContainer>
            <Svg fill="#fff" src={ArrowIcon} />
          </ArrowContainer>
        </Wallet>
      </Wallets>
    </Modal>
  )
}

export default React.memo(WalletSelectorModal)
