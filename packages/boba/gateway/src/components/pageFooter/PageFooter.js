import React from 'react'
import { useSelector } from 'react-redux'

import { Box, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Telegram, Twitter } from '@mui/icons-material'

import GasSwitcher from '../mainMenu/gasSwitcher/GasSwitcher'

import { selectLayer } from 'selectors/setupSelector'
import { selectActiveNetwork, selectActiveNetworkType } from 'selectors/networkSelector'

import { LAYER, ROUTES_PATH, WALLET_VERSION } from 'util/constant'
import { getBlockExplorerUrl } from 'util/network/network.util'

import DiscordIcon from 'components/icons/DiscordIcon'
import BobaLogo from '../../images/boba2/logo-boba2.svg'

import * as S from './PageFooter.styles'

const PageFooter = ({ maintenance }) => {

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const layer = useSelector(selectLayer())
  const network = useSelector(selectActiveNetwork())
  const networkType = useSelector(selectActiveNetworkType())
  const appVersion = WALLET_VERSION;

  if (maintenance) {
    return (
      <S.Wrapper>
        <S.ContentWrapper>
          <S.FooterLogoWrapper>
            <img
              src={BobaLogo}
              alt="boba logo"
            />
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
            >Boba Docs</S.FooterLinkExt>
          </S.LinkWrapper>
          <S.FooterDividerMobile />
          <S.SocialWrapper>
            <IconButton href="https://boba.eco/twitter" target='_blank' aria-label="twitter">
              <Twitter sx={{ opacity: 0.65 }} />
            </IconButton>
            <IconButton href="https://boba.eco/discord" target='_blank' aria-label="discord">
              <DiscordIcon />
            </IconButton>
            <IconButton href="https://boba.eco/telegram" target='_blank' aria-label="telegram">
              <Telegram sx={{ opacity: 0.65 }} />
            </IconButton>
            <S.FooterLinkExt
              href="https://boba.network"
              component="a"
              target="_blank"
              sx={{ whiteSpace: 'nowrap' }}
            >Boba Website</S.FooterLinkExt>
          </S.SocialWrapper>
        </S.FooterLinkWrapper>
      </S.Wrapper>
    )
  }
  return (
    <>
      { !isMobile && <S.FooterDivider />}
      <S.Wrapper>
      { !!isMobile && <S.FooterDivider />}
        <S.FooterLinkWrapper>
          <S.FooterLinkWrapperLeft>
            <GasSwitcher />
            <S.LinkWrapper>
              <S.FooterLink
                to={ROUTES_PATH.HELP}
              >FAQs</S.FooterLink>
              <S.FooterLink
                to={ROUTES_PATH.DEV_TOOLS}
                sx={{ whiteSpace: 'nowrap' }}
              >Dev Tools</S.FooterLink>
              <S.FooterLink
                to={ROUTES_PATH.BOBASCOPE}
              >BobaScope</S.FooterLink>
              <S.FooterLinkExt
                href={getBlockExplorerUrl({
                  network,
                  networkType,
                  layer: layer || LAYER.L1
                })}
                component="a"
                target="_blank"
                sx={{ whiteSpace: 'nowrap' }}
              >Blockexplorer</S.FooterLinkExt>
              <S.FooterLinkExt
                href="https://docs.boba.network"
                component="a"
                target="_blank"
                sx={{ whiteSpace: 'nowrap' }}
              >Boba Docs</S.FooterLinkExt>
            </S.LinkWrapper>
          </S.FooterLinkWrapperLeft>
          <S.FooterDividerMobile />
          <S.SocialWrapper>
            <IconButton href="https://boba.eco/twitter" target='_blank' aria-label="twitter">
              <Twitter sx={{ opacity: 0.65 }} />
            </IconButton>
            <IconButton href="https://boba.eco/discord" target='_blank' aria-label="discord">
              <DiscordIcon />
            </IconButton>
            <IconButton href="https://boba.eco/telegram" target='_blank' aria-label="telegram">
              <Telegram sx={{ opacity: 0.65 }} />
            </IconButton>
            <S.FooterLinkExt
              href="https://boba.network"
              component="a"
              target="_blank"
              sx={{ whiteSpace: 'nowrap' }}
            >Boba Website
            </S.FooterLinkExt>
          </S.SocialWrapper>
        </S.FooterLinkWrapper>
        <Box display="flex" justifyContent="center" alignItems="center" pb={1}>
          <Typography component='p' variant="body3" sx={{ opacity: 0.65 }}>App Version {appVersion}</Typography>
        </Box>
      </S.Wrapper>
    </>
  )
}

export default PageFooter
