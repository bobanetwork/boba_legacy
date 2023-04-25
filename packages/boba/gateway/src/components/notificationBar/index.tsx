import React, { ReactNode, useState } from 'react'
import styled from 'styled-components'
import CloseIcon from 'components/icons/CloseIcon'

// @style
const NotificationBarContainer = styled.div`
  max-height: 0;
  line-height: 40px;
  font-size: 13px;
  line-height: 18px;
  position: relative;
  transition: max-height 0.4s linear;
  padding: 0 40px;
  overflow: hidden;
  background: ${(props) => props.theme.primarybg};
  color: ${(props) => props.theme.primaryfg};

  &.open {
    max-height: 60px;
  }
`

const NotificationBarMessage = styled.div`
  text-align: center;
  font-size: 18px;
  line-height: 1.2em;
  max-width: 1440px;
  margin: 0 auto;
  padding: 10px 75px;
  color: ${(props) => props.theme.primaryfg};

  a {
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
    opacity: 0.65;
  }
`

const NotificationBarCloseIcon = styled.div`
  position: absolute;
  top: 50%;
  right: 32px;
  transform: translate(0, -50%);
  line-height: 0;
  cursor: pointer;
  opacity: 0.4;
  display: block;

  svg path {
    fill: white;
  }
`

// @inteface
interface NotificationBarProps {
  message?: string
  content?: string
  open?: boolean
  children?: ReactNode
  onClose?: (() => void) | null
}

// @component
const NotificationBar: React.FC<NotificationBarProps> = ({
  message,
  content,
  open = false,
  children,
  onClose = null,
}: NotificationBarProps) => {
  const [readMore, setReadMore] = useState(false)

  return (
    <NotificationBarContainer className={`${open && 'open'}`}>
      <NotificationBarMessage>
        {message ? (readMore ? content : message) : children}
        {content && (
          <a onClick={() => setReadMore(!readMore)}>
            {' '}
            {!readMore ? `read more` : 'read less'}
          </a>
        )}
      </NotificationBarMessage>
      {onClose !== null && (
        <NotificationBarCloseIcon>
          <CloseIcon />
        </NotificationBarCloseIcon>
      )}
    </NotificationBarContainer>
  )
}

export default NotificationBar
