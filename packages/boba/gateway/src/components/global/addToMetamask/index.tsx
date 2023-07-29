import React from 'react'
import { getCoinImage } from 'util/coinImage'
import MetamaskLogo from 'assets/images/metamask.svg'
import networkService from 'services/networkService'
import styled from 'styled-components'

type TokenType = {
  symbol: string
  decimals: number
  address: string
  chain: string
}

type AddToMetamaskType = {
  token: TokenType
  className: string
}

const AddToMetamaskContainer = styled.div`
  margin-left: auto;
  cursor: pointer;
`

export const AddToMetamask = ({
  token,
  className,
}: AddToMetamaskType): JSX.Element => {
  const { symbol } = token || {}
  const logoURI = getCoinImage(symbol)
  const handleAddToMetamask = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    networkService.walletService.addTokenToMetaMask({ ...token, logoURI })
  }

  return (
    <AddToMetamaskContainer
      onClick={(e) => handleAddToMetamask(e)}
      className={className}
    >
      <img
        src={MetamaskLogo}
        alt="add To Metamask"
        width="20px"
        height="20px"
      />
    </AddToMetamaskContainer>
  )
}
