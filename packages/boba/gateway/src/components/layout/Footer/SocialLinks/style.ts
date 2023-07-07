import { Typography } from '@mui/material'
import styled from 'styled-components'

export const SocialLinksContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const StyledSocialLinks = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 30px;
  flex: 1;
`

export const SocialLinkItem = styled.a`
  user-select: none;
  display: flex;
  text-decoration: none;
  text-align: center;
  overflow: visible;
  svg {
    &#docs {
      path {
        fill: none;
        stroke: ${({ theme }) =>
          theme.name === 'light'
            ? theme.colors['gray'][600]
            : theme.colors['gray'][200]};
          };
      }
    }
    path {
      fill: ${({ theme }) =>
        theme.name === 'light'
          ? theme.colors['gray'][600]
          : theme.colors['gray'][200]}
        };
    }
  }
  &:hover {
    svg {
      &#docs {
        path {
          fill: none;
          stroke: ${({ theme }) =>
            theme.name === 'light'
              ? theme.colors['gray'][700]
              : theme.colors['gray'][100]}};
        }
      }
      path {
        fill: ${({ theme }) =>
          theme.name === 'light'
            ? theme.colors['gray'][700]
            : theme.colors['gray'][100]}};
      }
    }
  }
`

export const AppVersion = styled(Typography).attrs({
  variant: 'body2',
})`
  justify-self: flex-end;
  color: ${({ theme }) =>
    theme.name === 'light'
      ? theme.colors['gray'][600]
      : theme.colors['gray'][200]};
`
