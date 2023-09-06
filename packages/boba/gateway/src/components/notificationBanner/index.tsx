import React, { ReactNode, useState } from 'react'
import styled from 'styled-components'
import { BannerConfig } from './bannerConfig'
import { selectActiveNetwork } from 'selectors'
import { useSelector } from 'react-redux'
import { Typography } from 'components/global'

// @style
const NotificationBannerContainer = styled('div')`
  max-height: 0;
  position: relative;
  transition: max-height 0.4s;
  padding: 0 40px;
  overflow: hidden;
  background: ${(props) => props.theme.primarybg};
  color: ${(props) => props.theme.primaryfg};

  &.open {
    max-height: 60px;
  }

  @media ${(props) => props.theme.screen.tablet} {
    padding: 0 10px;
    &.open.expand {
      max-height: 120px;
    }
  }
`

const NotificationBannerMessage = styled(Typography).attrs({
  variant: 'body2',
})`
  text-align: center;
  max-width: 1440px;
  margin: 0 auto;
  padding: 10px 75px;

  @media ${(props) => props.theme.screen.mobile} {
    padding: 5px 10px;
  }

  a {
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
    opacity: 0.65;
  }
`

const ReadMoreLess = styled.span`
  cursor: pointer;
  opacity: 0.65;
  text-decoration: underline;
  color: inherit;
  margin-left: 8px;
`

// @inteface
interface NotificationBannerProps {
  children?: ReactNode
}

/**
 * Notification banner is sticky banner at the top of the gateway.
 */

// @component
const NotificationBanner: React.FC<NotificationBannerProps> = ({
  children,
}: NotificationBannerProps) => {
  const [readMore, setReadMore] = useState(false)

  const activeNetwork = useSelector(selectActiveNetwork())

  const bannerContent = BannerConfig[activeNetwork]

  if (!bannerContent) {
    return <></>
  }

  return (
    <NotificationBannerContainer
      className={`${bannerContent.message ? 'open' : ''} ${
        readMore ? 'expand' : ''
      }`}
    >
      <NotificationBannerMessage data-testid="message">
        {bannerContent
          ? readMore
            ? bannerContent.content
            : bannerContent.message
          : children}
        {bannerContent.content && (
          <ReadMoreLess role="readMore" onClick={() => setReadMore(!readMore)}>
            {`Read ${!readMore ? 'more' : 'less'}`}
          </ReadMoreLess>
        )}
      </NotificationBannerMessage>
    </NotificationBannerContainer>
  )
}

export default NotificationBanner
