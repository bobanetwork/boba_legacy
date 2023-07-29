import styled from 'styled-components'
import { Typography } from 'components/global/typography'
import stakeBg from 'assets/images/boba2/stake-balance-bg.png'

export const StakePageContainer = styled.div`
  margin: 0px auto 20px auto;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 0px 10px 10px 10px;
  width: 70%;
`

export const StakeEarnContainer = styled.div`
  border-radius: 20px;
  padding: 24px;
  min-height: 150px;
  margin-bottom: 10px;
  width: 100%;
  backdrop-filter: blur(10px);
  background: url(${stakeBg}) ${(props) => props.theme.colors.box.background}
    no-repeat;
  background-position: '100% 0%';
  background-size: '40%';
`

export const StakeInputContainer = styled.div`
  background: ${(props) => props.theme.colors.box.background},
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 32px 24px;
  min-height: 150px;
  gap: 10px;
  display: flex;
  flex-direction: column;
  width: 100%;
`
export const StakeHeadContainer = styled.div`
  background: ${(props) => props.theme.colors.box.background};
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 10px 20px;
  width: 100%;
  margin-bottom: 10px;
`

export const StakeContainer = styled.div`
  display: flex,
  justify-content: center;
  align-items: center;
  background: ${(props) => props.theme.colors.box.background};
  border-radius: 20px;
  padding: 24px;
  min-height: 400px;
  width: 100%;
`

export const StakeItemContainer = styled.div`
  background: ${(props) => props.theme.colors.box.background};
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: '20px';
  width: 100%;
`

export const StakeItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const TableHeading = styled.div`
  padding: '20px';
  border-top-left-radius: '6px';
  border-top-right-radius: '6px';
  display: 'flex';
  justify-content: 'center';
  align-items: 'center';
  background: ${(props) => props.theme.colors.background.secondary};
`

export const LayerAlert = styled.div`
  width: '100%';
  display: 'flex';
  justify-content: 'space-between';
  align-items: 'center';
  flex-direction: 'column';
  gap: '10px';
  border-radius: '8px';
  margin: '20px 0px';
  padding: '20px';
  background: ${(props) => props.theme.colors.background.secondary};
`

export const AlertText = styled(Typography)``

export const AlertInfo = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex: 1;
`

export const Wrapper = styled.div`
  border-radius: '8px';
  background: ${(props) => props.theme.colors.background.secondary};
`

export const GridItemTag = styled.div`
  text-align: left;
`

export const ListContainer = styled.div``

export const BlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  width: 100%;
  gap: 25px 0px;
  border-radius: 12px;
  background: ${(props) => props.theme.colors.box.background};
  border: 1px solid ${(props) => props.theme.colors.box.border};,
`
