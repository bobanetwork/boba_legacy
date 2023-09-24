import React from 'react'
import {
  DisclaimerContainer,
  DisclaimerText,
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
    <SocialLinksContainer>
      <DisclaimerContainer>
        <DisclaimerText>©2023 Enya Labs</DisclaimerText>
        <DisclaimerText>v{WALLET_VERSION}</DisclaimerText>
      </DisclaimerContainer>
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
    </SocialLinksContainer>
  )
}

export default SocialLinks
