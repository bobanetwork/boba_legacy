import { Heading } from 'components/global'
import React, { FC, useEffect, useState } from 'react'
import { getCoinImage } from 'util/coinImage'
import { BridgeItem, BridgeIcon, BridgeLabel, BridgeWrapper } from '../styles'
import { useSelector } from 'react-redux'
import Banxa from 'assets/images/bridges/banxa.svg'
import {
  selectActiveNetwork,
  selectActiveNetworkType,
  selectTokenToBridge,
  selectWalletAddress,
} from 'selectors'
import { NETWORK_TYPE, NETWORK } from 'util/network/network.util'
import { prepareBanxaUrl } from 'util/banxa'
import { IBridges, bridgeByToken } from './data'

const ThirdPartyBridges: FC = () => {
  const token = useSelector(selectTokenToBridge())
  const networkType = useSelector(selectActiveNetworkType())
  const network = useSelector(selectActiveNetwork())
  const [bridges, setbridges] = useState<Array<IBridges>>([])
  const userWallet = useSelector(selectWalletAddress())
  const [banxaUrl, setBanxaUrl] = useState<string>('')
  const [isBanxaEnable, setIsBanxaEnable] = useState<boolean>(false)

  useEffect(() => {
    if (token) {
      const _bridges = bridgeByToken(token?.symbol)
      setbridges(_bridges)

      if (token?.symbol === 'ETH' || token?.symbol === 'BOBA') {
        const _banxaUrl = prepareBanxaUrl({
          symbol: token.symbol,
          address: userWallet,
        })
        setBanxaUrl(_banxaUrl)
        setIsBanxaEnable(true)
      }
    }
  }, [token, userWallet])

  if (
    !token ||
    networkType === NETWORK_TYPE.TESTNET ||
    network !== NETWORK.ETHEREUM ||
    (!isBanxaEnable && !bridges.length)
  ) {
    return <></>
  }

  return (
    <BridgeWrapper>
      <Heading variant="h3"> Third party bridges</Heading>
      {network === NETWORK.ETHEREUM && isBanxaEnable && (
        <BridgeItem
          href={banxaUrl}
          target="_blank"
          rel="noopener noreferrer"
          key="banxa"
        >
          <BridgeIcon>
            <img src={Banxa} alt={`ETH logo`} width="32px" height="32px" />
          </BridgeIcon>
          <BridgeLabel>Banxa</BridgeLabel>
        </BridgeItem>
      )}
      {bridges.map((bridge: IBridges) => (
        <BridgeItem
          href={bridge.link}
          target="_blank"
          rel="noopener noreferrer"
          key={bridge.name}
        >
          <BridgeIcon>
            <img
              src={bridge.icon}
              alt={`${bridge.name} logo`}
              width="32px"
              height="32px"
            />
          </BridgeIcon>
          <BridgeLabel>{bridge.name}</BridgeLabel>
        </BridgeItem>
      ))}
    </BridgeWrapper>
  )
}

export default ThirdPartyBridges
