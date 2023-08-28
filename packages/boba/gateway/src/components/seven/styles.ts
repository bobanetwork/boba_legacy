import styled, { css } from 'styled-components'
import { Typography } from 'components/global'

export const ExitsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  background: ${(props) => props.theme.colors.popup};
  gap: 5px;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      border: solid 1px ${props.theme.colors.gray[400]};
      &:hover {
        background: ${props.theme.colors.gray[300]};
        border: solid 1px ${props.theme.colors.gray[500]};
      }
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      border: solid 1px ${props.theme.colors.gray[300]};
      &:hover {
        background: ${props.theme.colors.gray[300]};
      }
    `}
  padding: 10px;
  border-radius: 12px;
`

export const HashContainer = styled(Typography)`
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[700]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: ${props.theme.colors.gray[50]};
    `}
`

export const Hash = styled.a`
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[700]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: ${props.theme.colors.gray[50]};
    `}
`
