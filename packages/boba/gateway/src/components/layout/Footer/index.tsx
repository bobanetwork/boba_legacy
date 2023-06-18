import React, { FC } from 'react'
import { FooterProps } from './types'
import { DividerLine, StyledFooter } from './style'
import GasWatcher from './GasWatcher'
import SocialLinks from './SocialLinks'
import FooterLinks from './FooterLinks'

export const Footer: FC<FooterProps> = (props) => {
  return (
    <StyledFooter>
      <GasWatcher />
      <DividerLine />
      <SocialLinks />
      <FooterLinks />
    </StyledFooter>
  )
}
