import { Telegram, Twitter } from '@mui/icons-material'
import DiscordIcon from 'components/icons/DiscordIcon'
import React from 'react'
import BobaLogo from '../../images/boba2/logo-boba2.svg'
import GasSwitcher from '../mainMenu/gasSwitcher/GasSwitcher'
import * as S from './PageFooter.styles'
import { useMediaQuery, useTheme } from '@mui/material'
import { LAYER, ROUTES_PATH, WALLET_VERSION } from 'util/constant'
import { useSelector } from 'react-redux'
import {
  selectLayer,
  selectActiveNetwork,
  selectActiveNetworkType,
} from 'selectors'
import { getBlockExplorerUrl } from 'util/network/network.util'


const PageFooter = ({ maintenance }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [isDiscordHover, setIsDiscordHover] = React.useState(false)

  const layer = useSelector(selectLayer())
  const network = useSelector(selectActiveNetwork())
  const networkType = useSelector(selectActiveNetworkType())

  if (maintenance) {
    return (
      <S.Wrapper>
        <S.ContentWrapper>
          <S.FooterLogoWrapper>
            <img src={BobaLogo} alt="boba logo" />
          </S.FooterLogoWrapper>
        </S.ContentWrapper>
        <S.FooterDivider />
        <S.FooterLinkWrapper>
          <S.LinkWrapper>
            <S.FooterLinkExt
              href="https://docs.boba.network"
              component="a"
              target="_blank"
              sx={{ whiteSpace: 'nowrap' }}
            >
              Boba Docs
            </S.FooterLinkExt>
          </S.LinkWrapper>
          <S.FooterDividerMobile />
          <S.SocialWrapper>
            <S.SocialButton
              href="https://boba.eco/twitter"
              target="_blank"
              aria-label="twitter"
            >
              <Twitter />
            </S.SocialButton>
            <S.SocialButton
              href="https://boba.eco/discord"
              target="_blank"
              aria-label="discord"
              onMouseEnter={() => setIsDiscordHover(true)}
              onMouseLeave={() => setIsDiscordHover(false)}
            >
              <DiscordIcon isDiscordHover={isDiscordHover} />
            </S.SocialButton>
            <S.SocialButton
              href="https://boba.eco/telegram"
              target="_blank"
              aria-label="telegram"
            >
              <Telegram />
            </S.SocialButton>
            <S.FooterLinkExt
              href="https://boba.network"
              component="a"
              target="_blank"
              sx={{ whiteSpace: 'nowrap' }}
            >
              Boba Website
            </S.FooterLinkExt>
          </S.SocialWrapper>
        </S.FooterLinkWrapper>
      </S.Wrapper>
    )
  }
  return (
    <S.Wrapper>
      <S.FooterLinkWrapper my={1} mx="auto">
        <S.SocialWrapper>
          <S.SocialButton
            href="https://boba.eco/twitter"
            target="_blank"
            aria-label="twitter"
          >
            <Twitter />
          </S.SocialButton>
          <S.SocialButton
            href="https://boba.eco/discord"
            target="_blank"
            aria-label="discord"
            onMouseEnter={() => setIsDiscordHover(true)}
            onMouseLeave={() => setIsDiscordHover(false)}
          >
            <DiscordIcon isDiscordHover={isDiscordHover} />
          </S.SocialButton>
          <S.SocialButton
            href="https://boba.eco/telegram"
            target="_blank"
            aria-label="telegram"
          >
            <Telegram />
          </S.SocialButton>
        </S.SocialWrapper>
        {!isMobile && <GasSwitcher />}
      </S.FooterLinkWrapper>

      <S.FooterDivider />
      <S.FooterLinkWrapper my={1} mx="auto">
        <S.FooterLinkWrapperLeft>
          <S.LinkWrapper>
            <S.FooterLinkExt
              href="https://docs.boba.network/faq"
              component="a"
              target="_blank"
              sx={{ whiteSpace: 'nowrap' }}
            >
              FAQs
            </S.FooterLinkExt>
            <S.FooterLink
              to={ROUTES_PATH.DEV_TOOLS}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Dev Tools
            </S.FooterLink>
            <S.FooterLink to={ROUTES_PATH.BOBASCOPE}>BobaScope</S.FooterLink>
            <S.FooterLinkExt
              href={getBlockExplorerUrl({
                network,
                networkType,
                layer: layer || LAYER.L1,
              })}
              component="a"
              target="_blank"
              sx={{ whiteSpace: 'nowrap' }}
            >
              Blockexplorer
            </S.FooterLinkExt>
            <S.FooterLinkExt
              href="https://docs.boba.network"
              component="a"
              target="_blank"
              sx={{ whiteSpace: 'nowrap' }}
            >
              Boba Docs
            </S.FooterLinkExt>
          </S.LinkWrapper>
        </S.FooterLinkWrapperLeft>
        <S.FooterDividerMobile />
          <S.FooterLinkExt
            href="https://boba.network"
            component="a"
            target="_blank"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Boba Website
          </S.FooterLinkExt>
      </S.FooterLinkWrapper>
      <S.FooterLinkExt
            sx={{ whiteSpace: 'nowrap' }}
        >
        v{WALLET_VERSION}
      </S.FooterLinkExt>
    </S.Wrapper>
  )
}

export default PageFooter
