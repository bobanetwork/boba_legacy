import React from 'react'
import {
  AppVersion,
  SocialLinkItem,
  SocialLinksContainer,
  StyledSocialLinks,
} from './style'
import DocsIcon from './icons/docs'
import DiscordIcon from './icons/discord'
import TwitterIcon from './icons/twitter'
import TelegramIcon from './icons/telegram'
import { WALLET_VERSION } from 'util/constant'

interface Props {}

const SocialLinks = (props: Props) => {
  return (
    <SocialLinksContainer id="socialLinks">
      <StyledSocialLinks>
        <SocialLinkItem
          href="https://docs.boba.network"
          target="_blank"
          aria-label="bobaDocs"
        >
          <DocsIcon />
        </SocialLinkItem>
        <SocialLinkItem
          href="https://boba.eco/twitter"
          target="_blank"
          aria-label="twitter"
        >
          <TwitterIcon />
        </SocialLinkItem>
        <SocialLinkItem
          href="https://boba.eco/discord"
          target="_blank"
          aria-label="discord"
        >
          <DiscordIcon />
        </SocialLinkItem>
        <SocialLinkItem
          href="https://boba.eco/telegram"
          target="_blank"
          aria-label="telegram"
        >
          <TelegramIcon />
        </SocialLinkItem>
      </StyledSocialLinks>
      <AppVersion>v{WALLET_VERSION}</AppVersion>
    </SocialLinksContainer>
  )
}

export default SocialLinks
