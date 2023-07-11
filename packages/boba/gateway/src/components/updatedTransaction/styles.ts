import styled, { css } from 'styled-components'
import { styled as styledOld } from '@mui/material/styles'
import { Box, Grid } from '@mui/material'

export const TransactionAmount = styled.div`
  font-size: 14px;
  width: 80px;
`

export const Date = styled.div`
  color: var(--dark-type-1, #eee);
  font-family: Roboto;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  min-width: 168px;
  text-align: left;
`

export const Icon = styled.img`
  width: 32px;
  height: 32px;
`

export const Status = styled.div`
  font-size: 14px;
  width: 88px;
  text-align: left;
`

export const TransactionChain = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 142px;
  gap: 8px;
  text-align: left;
`

export const TransactionChainDetails = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 14px;
  gap: 2px;
`

export const TransactionEntry = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 24px;
  align-items: center;
  // gap: 56px;
  font-size: 16px;
  width: 100%;
`

export const TransactionToken = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  width: 90px;
  text-align: left;
`

export const Wrapper = styled.div`
  borderradius: 0;
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      color: ${props.theme.colors.gray[800]};
      background: ${props.theme.colors.gray[100]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      color: ${props.theme.colors.gray[50]};
      background: ${props.theme.colors.gray[300]};
    `}

  @media screen and (max-width: 900px) {
    flexdirection: 'column';
    padding: '30px 10px';
  }
  @media screen and (min-width: 901px) {
    padding: '10px';
  }
`

export const WrapperOld = styledOld(Box)(({ theme, ...props }) => ({
  borderBottom:
    theme.palette.mode === 'light' ? '1px solid #c3c5c7' : '1px solid #192537',
  borderRadius: '0',
  background: theme.palette.background.secondary,
  [theme.breakpoints.down('md')]: {
    padding: '30px 10px',
  },
  [theme.breakpoints.up('md')]: {
    padding: '10px',
  },
}))

export const GridContainer = styled.div<{ container: boolean }>`
  @media screen and (max-width: 900px) {
    justify-content: 'flex-start';
  }
`

export const GridContainerOld = styledOld(Grid)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    justifyContent: 'flex-start',
  },
}))

export const GridItemTag = styled.div<{
  xs: number
  item: boolean
  md: number
}>`
  display: flex;
  alignitems: center;
  @media screen and (max-width: 900px) {
    flexdirection: 'column';
    ${(props) =>
      css`
        padding: ${props.xs === 12 ? '20px 0px 0px' : 'inherit'};
      `};
  }
`

export const GridItemTagOld = styledOld(Grid)(({ theme, ...props }) => ({
  display: 'flex',
  alignItems: 'center',
  [theme.breakpoints.down('md')]: {
    padding: `${props.xs === 12 ? '20px 0px 0px' : 'inherit'}`,
  },
}))

export const DropdownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 5px;
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  text-align: center;

  ${(props) =>
    props.theme.name === 'light' &&
    css`
      background-color: ${props.theme.colors.gray[100]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      background-color: ${props.theme.colors.gray[500]};
    `}
`

export const DropdownWrapperOld = styledOld(Box)`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 5px;
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  background-color: ${(props) => props.theme.palette.background.secondary};
  text-align: center;
`

export const DropdownContent = styled.div`
  display: flex;
  justifycontent: space-between;
  @media screen and (max-width: 900px) {
    flexDirection: 'column',
    gap: '5px',
    padding: '5px',
  }
  @media screen and (min-width: 901px) {
    flexDirection: 'row',
    gap: '16px',
  }
`

export const DropdownContentOld = styledOld(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',

  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    gap: '5px',
    padding: '5px',
  },
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    gap: '16px',
  },
}))
