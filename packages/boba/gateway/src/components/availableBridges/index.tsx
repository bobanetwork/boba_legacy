import { Text } from 'components/global'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { bridgeByToken } from 'components/availableBridges/bobaBridges'
import { useSelector } from 'react-redux'
import { selectActiveNetwork, selectActiveNetworkType } from 'selectors'
import { NETWORK, NETWORK_TYPE } from 'util/network/network.util'
import { prepareBanxaUrl } from 'util/banxa'
import { AvailableBridgesProps, IBridges } from './types'

const AvailableBridgeContainer = styled.div(({ theme }) => ({
  background: theme.bg.glassy,
  filter: 'drop-shadow(0px 4px 20px rgba(35, 92, 41, 0.06))',
  borderRadius: '20px',
  border: 'none',
  backdropFilter: 'blur(50px)',
  flex: 1,
  minHeight: 'fit-content',
  padding: '20px 24px',
  width: '100%',
  maxWidth: '600px',
}))

const AvailableBridgeTitle = styled(Text)`
  font-size: 1rem;
  margin-bottom: 10px;
`

const Link = styled.a`
  text-decoration: none;
  color: inherit;
`

const AvailableBridgeContent = styled(Text)(({ theme }) => ({
  borderRadius: '12px',
  background: theme.bg.secondary,
  border: theme.border,
  lineHeight: 1.5,
  padding: '10px',
  marginBottom: '5px',
  fontSize: '1rem',
}))

export const AvailableBridges = ({
  token = null,
  walletAddress = '',
}: AvailableBridgesProps) => {
  const [bridges, setbridges] = useState<IBridges[]>([])
  const [banxaUrl, setBanxaUrl] = useState<string>('')
  const [isBanxaEnable, setIsBanxaEnable] = useState<boolean>(false)

  const networkType = useSelector(selectActiveNetworkType())
  const network = useSelector(selectActiveNetwork())

  useEffect(() => {
    if (token) {
      const _bridges = bridgeByToken(token?.symbol)
      setbridges(_bridges)

      if (token?.symbol === 'ETH' || token?.symbol === 'BOBA') {
        const _banxaUrl = prepareBanxaUrl({
          symbol: token.symbol,
          address: walletAddress,
        })
        setBanxaUrl(_banxaUrl)
        setIsBanxaEnable(true)
      }
    }
  }, [token, walletAddress])

  if (
    networkType === NETWORK_TYPE.TESTNET ||
    network !== NETWORK.ETHEREUM ||
    (!isBanxaEnable && !bridges.length)
  ) {
    return <></>
  }

  return (
    <AvailableBridgeContainer>
      <AvailableBridgeTitle>Third party bridges</AvailableBridgeTitle>
      {network === NETWORK.ETHEREUM && isBanxaEnable && (
        <Link
          key="banxa"
          href={banxaUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <AvailableBridgeContent>Banxa</AvailableBridgeContent>
        </Link>
      )}
      {bridges.map((bridge: any) => (
        <Link
          key={bridge.name}
          href={bridge.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          <AvailableBridgeContent>{bridge.name}</AvailableBridgeContent>
        </Link>
      ))}
    </AvailableBridgeContainer>
  )
}
