import styled from 'styled-components'
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
`;

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
      background: #BAE21A;
    }
  }
`

