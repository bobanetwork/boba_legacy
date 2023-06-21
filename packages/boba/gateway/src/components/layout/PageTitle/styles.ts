import styled, { css } from 'styled-components'

import { Heading } from 'components/global/heading'
import { Typography } from 'components/global/typography'

export const PageTitleContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 50px 15px;
  gap: 15px 0px;
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
