import React from 'react'
import { FOOTERLINKS, FOOTERLINKS_RIGHT } from './constant'
import { LinkContainer, StyledLink, StyledNavLink } from './style'
import { link } from 'fs'

interface Props {}

const FooterLinks = (props: Props) => {
  return (
    <LinkContainer>
      <div>
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
      </div>
      <div>
        {FOOTERLINKS_RIGHT.map((link) => (
          <StyledLink key={link.label} href={link.path}>
            {link.label}
          </StyledLink>
        ))}
      </div>
    </LinkContainer>
  )
}

export default FooterLinks
