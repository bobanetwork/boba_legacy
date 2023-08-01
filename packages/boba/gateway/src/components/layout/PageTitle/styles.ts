import styled, { css } from 'styled-components'

import { Heading } from 'components/global/heading'
import { Typography } from 'components/global/typography'
import { mobile } from 'themes/screens'

export const PageTitleContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 50px 15px;
  gap: 15px 0px;
  ${mobile(css`
    text-align: center;
  `)}
`

export const Title = styled(Heading)`
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[800]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: #fff;
    `}
`

export const Slug = styled(Typography)`
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[700]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: #acacac;
    `}
`
