import styled, { css } from 'styled-components'
import { Typography } from 'components/global/typography'

export const EarnPageContainer = styled.div`
  margin: 0px auto;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 10px;
  padding-top: 0px;
  width: 1025px;
`

export const TableHeading = styled.div`
  padding: 20px,
  border-radius: 6px 6px 0 0;
  display: flex;
  align-items: center;
  background: ${(props) => props.theme.colors.box.background};
`

export const LayerAlert = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
  border-radius: 8px;
  margin: 20px 0px;
  padding: 25px;
  background: ${(props) => props.theme.colors.box.background};
`

export const Help = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
  margin: 10px 0px;
  padding: 10px;
  border-radius: 8px;
  background: ${(props) => props.theme.colors.box.background};
  ${({ theme: { name, colors } }) => css`
    border: 1px solid ${name === 'light' ? colors.blue[200] : colors.blue[100]};
    background: ${name === 'light' ? colors.blue[50] : colors.blue[500]};
    color: ${name === 'light' ? colors.blue[500] : colors.blue[100]};
  `}
`

export const AlertText = styled(Typography)`
  margin-left: 10px;
  flex: 4;
`

export const AlertInfo = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex: 1;
`

export const Wrapper = styled.div`
  border-radius: 8px;
`

export const GridItemTagContainer = styled.div`
  spacing: 2,
  flex-direction: row;
  justify-content: left;
  align-items: center;
`

export const GridItemTag = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
`

export const EarnAction = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
`

export const EarnActionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0px;
`

export const EarnListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px 0px;
  padding: 10px 0px;
`

export const BpIcon = styled.span`
  border-radius: 3;
  width: 16;
  height: 16;
`

export const PageSwitcher = styled.div`
  width: fit-content;
  padding: 3px;
  cursor: pointer;
  display: flex;
  border-radius: 12px;
  height: 48px;
  span {
    padding: 2px 15px;
    font-weight: bold;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    &.active {
      color: #031313;
      background: #bae21a;
    }
  }
`

export const TabSwitcherContainer = styled.div`
  display: flex;
  padding: 4px;
  gap: 0px 15px;
  border-radius: 8px;
  ${({ theme: { colors, name } }) =>
    name === 'light'
      ? css`
          background: ${colors.gray[50]};
        `
      : css`
          background: ${colors.gray[500]};
        `}
`

export const Tab = styled.div<{ active: boolean }>`
  padding: 8px 24px;
  border-radius: 8px;
  cursor: pointer;
  ${(props) =>
    props.active &&
    `
        color:${props.theme.colors.gray[800]};
        background:${props.theme.colors.green[300]}
    `}
`
