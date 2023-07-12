import styled, { css } from 'styled-components'
import { Typography } from 'components/global/typography'

export const ModalTypography = styled(Typography)`
  font-weight: 400;
  line-height: 1.1;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[700]};
    `}

  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: ${props.theme.colors.gray[100]};
    `}
`
