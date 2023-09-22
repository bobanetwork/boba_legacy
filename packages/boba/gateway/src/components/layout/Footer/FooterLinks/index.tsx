import Menu from 'components/global/menu'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectActiveNetworkType } from 'selectors'
import { NETWORK, NETWORK_TYPE } from 'util/network/network.util'
import { FOOTERLINKS } from './constant'
import {
  LinkContainer,
  ScanContainer,
  StyledLink,
  StyledLinks,
  StyledNavLink,
} from './style'

const blockExplorerLinks = {
  [NETWORK_TYPE.TESTNET]: {
    [NETWORK.ETHEREUM]: {
      l1: `https://goerli.etherscan.io`,
      l2: `https://testnet.bobascan.com`,
    },
    [NETWORK.BNB]: {
      l1: `https://testnet.bscscan.com`,
      l2: `https://testnet.bobascan.com`,
    },
    [NETWORK.AVAX]: {
      l1: `https://testnet.snowtrace.io`,
      l2: `https://blockexplorer.testnet.avax.boba.network`,
    },
  },
  [NETWORK_TYPE.MAINNET]: {
    [NETWORK.ETHEREUM]: {
      l1: `https://etherscan.io`,
      l2: `https://bobascan.com`,
    },
    [NETWORK.BNB]: {
      l1: `https://bscscan.com`,
      l2: `https://bobascan.com`,
    },
    [NETWORK.AVAX]: {
      l1: `https://snowtrace.io/`,
      l2: `https://blockexplorer.avax.boba.network`,
    },
  },
}

const FooterLinks = () => {
  const activeNetworkType = useSelector(selectActiveNetworkType())

  const onLinkClick = (network, layer) => {
    const links = blockExplorerLinks[activeNetworkType]
    const explorerLink = links[network][layer]
    window.open(explorerLink, '_blank')
  }

  return (
    <LinkContainer>
      <StyledLinks>
        {FOOTERLINKS.map((link) => {
          if (link.isNav) {
            return (
              <StyledNavLink to={link.path} key={link.label}>
                {link.label}
              </StyledNavLink>
            )
          }
          return (
            <StyledLink key={link.label} href={link.path} target="_blank">
              {link.label}
            </StyledLink>
          )
        })}
      </StyledLinks>
      <ScanContainer>
        <Menu
          name="block explorer"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          variant="outline"
          options={[
            {
              label: 'Etherscan',
              onClick: () => onLinkClick(NETWORK.ETHEREUM, 'l1'),
            },
            {
              label: 'Bobascan',
              onClick: () => onLinkClick(NETWORK.ETHEREUM, 'l2'),
            },
            {
              label: 'BNB Block Explorer L1',
              onClick: () => onLinkClick(NETWORK.BNB, 'l1'),
            },
            {
              label: 'BNB Block Explorer L2',
              onClick: () => onLinkClick(NETWORK.BNB, 'l2'),
            },
            {
              label: 'AVAX Block Explorer L1',
              onClick: () => onLinkClick(NETWORK.AVAX, 'l1'),
            },
            {
              label: 'AVAX Block Explorer L2',
              onClick: () => onLinkClick(NETWORK.AVAX, 'l2'),
            },
          ]}
          label="Block explorers"
        />
      </ScanContainer>
    </LinkContainer>
  )
}

export default FooterLinks
