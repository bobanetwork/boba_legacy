import React, { useEffect } from 'react'
import { FOOTERLINKS, FOOTERLINKS_RIGHT } from './constant'
import { useSelector, useDispatch } from 'react-redux'
import {
  ExplorereButton,
  LinkContainer,
  ScanContainer,
  StyledLink,
  StyledLinks,
  StyledNavLink,
} from './style'
import { selectBlockExplorerLinks, selectBaseEnabled } from 'selectors'
import { fetchBlockExplorerUrls } from 'actions/networkAction'
import Select from 'components/global/select'

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
        <Select label="Block Explorers" />
        <ExplorereButton>Block Explorers</ExplorereButton>
      </ScanContainer>
    </LinkContainer>
  )
}

export default FooterLinks
