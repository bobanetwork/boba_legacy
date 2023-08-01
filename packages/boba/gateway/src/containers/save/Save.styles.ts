import styled, { css } from 'styled-components'
import { Typography } from 'components/global/typography'
import stakeBg from 'images/boba2/stake-balance-bg.png'
import { sdesktop, mobile } from 'themes/screens'

export const StakePageContainer = styled.div`
  margin: 0px auto 20px auto;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 0px 10px 50px 10px;
  width: 100%;
  max-width: 1024px;
  ${sdesktop(css`
    padding: 0px 0px 50px 0px;
  `)}
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
  display: flex;
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
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
  gap: 20px 0px;
  ${sdesktop(css`
    overflow-x: auto;
    align-items: flex-start;
    padding-right: 25px;
  `)}
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
  border: 1px solid ${(props) => props.theme.colors.box.border};
  ${sdesktop(css`
    flex-direction: row;
    justify-content: space-between;
  `)}
  ${mobile(css`
    flex-direction: column !important;
  `)}
   > div {
    ${mobile(css``)}
    button {
      ${mobile(css`
        width: 100%;
        border-radius: 8px;
      `)}
    }
  }
`

export const GridContainer = styled.div`
  display: flex;
  gap: 0px 35px;
  ${sdesktop(css`
    flex-direction: column;
    gap: 35px 0px;
  `)}
  ${mobile(css`
    flex-direction: column-reverse;
  `)}
  > div {
    width: 100%;
    &:first-of-type {
      max-width: 445px;
      ${sdesktop(css`
        max-width: 100%;
      `)}
    }
    &:last-of-type {
      ${mobile(css`
        > div {
          background: transparent;
          border: 0px;
        }
      `)}
    }
  }
`

export const Flex = styled.div`
  display: flex;
  padding-right: 35px;
  justify-content: space-between;
  ${sdesktop(css`
    gap: 0px 35px;
  `)}
`

export const TitleContainer = styled.div`
  padding: 25px 0px;
`

export const PaddingContainer = styled.div`
  padding: 0px;
  ${sdesktop(css`
    padding: 0px 15px;
  `)}
`

export const MobileTableContainer = styled.div`
  ${sdesktop(css`
    padding-left: 15px;
  `)}
`
