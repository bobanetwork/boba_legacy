import React, { useEffect } from 'react'
import { FOOTERLINKS, FOOTERLINKS_RIGHT } from './constant'
import { useSelector, useDispatch } from 'react-redux'
import { LinkContainer, StyledLink, StyledNavLink } from './style'
import { selectBlockExplorerLinks, selectBaseEnabled } from 'selectors'
import { fetchBlockExplorerUrls } from 'actions/networkAction'

const FooterLinks = () => {
  const dispatch = useDispatch<any>()
  const links = useSelector(selectBlockExplorerLinks())
  const baseEnabled = useSelector(selectBaseEnabled())

  useEffect(() => {
    if (!!baseEnabled) {
      dispatch(fetchBlockExplorerUrls())
    }
  }, [baseEnabled])

  return (
    <LinkContainer id="footerLinks">
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
        {links && links.length > 0 ? (
          <>
            <StyledLink key={'Blockexplorer'} href={links[0]} target="_blank">
              Blockexplorer
            </StyledLink>
            <StyledLink
              key={'BobaBlockexplorer'}
              href={links[1]}
              target="_blank"
            >
              Boba Blockexplorer
            </StyledLink>
          </>
        ) : null}
      </div>
      <div>
        {FOOTERLINKS_RIGHT.map((link) => (
          <StyledLink target="_blank" key={link.label} href={link.path}>
            {link.label}
          </StyledLink>
        ))}
      </div>
    </LinkContainer>
  )
}

export default FooterLinks
