import React, { useEffect } from 'react'
import { FOOTERLINKS, FOOTERLINKS_RIGHT } from './constant'
import { useSelector, useDispatch } from 'react-redux'
import { LinkContainer, StyledLink, StyledNavLink } from './style'
import {
  selectBlockExplorerLinks,
  selectActiveNetwork,
  selectBaseEnabled,
} from 'selectors'
import { setActiveBlockExplorerLinks } from 'actions/networkAction'

interface Props {}

const FooterLinks = (props: Props) => {
  const dispatch = useDispatch<any>()
  const blockExplorerLinks = useSelector(selectBlockExplorerLinks())
  const activeNetwork = useSelector(selectActiveNetwork())
  const baseEnabled = useSelector(selectBaseEnabled())
  useEffect(() => {
    dispatch(setActiveBlockExplorerLinks())
  }, [activeNetwork, baseEnabled])

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
        {blockExplorerLinks && (
          <>
            {' '}
            <StyledLink
              key={'Blockexplorer'}
              href={blockExplorerLinks[0]}
              target="_blank"
            >
              Blockexplorer
            </StyledLink>
            <StyledLink
              key={'BobaBlockexplorer'}
              href={blockExplorerLinks[1]}
              target="_blank"
            >
              Boba Blockexplorer
            </StyledLink>
          </>
        )}
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
