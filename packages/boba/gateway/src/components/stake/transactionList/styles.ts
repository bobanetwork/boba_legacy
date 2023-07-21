import styled from 'styled-components'

export const Wrapper = styled.div`
  border-radius: 0;
  background: ${(props) => props.theme.background.secondary};
`

export const Entry = styled.div`
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${(props) => props.theme.background.secondary};
`

export const GridCoontainer = styled.div``
export const GridItemTag = styled.div`
  text-align: left;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`

export const StakeItemDetails = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  background: ${(props) => props.theme.colors.box.background};
  border: 1px solid ${(props) => props.theme.colors.box.border};
  box-sizing: border-box;
  padding: 20px 35px;
  border-radius: 8px;
  > div {
    display: flex;
    margin: 0px auto;
    white-space: break-spaces;
    &:first-of-type {
      width: 35px;
      margin-left: 0px;
      margin-right: 10px;
      + div {
        margin-left: 0px;
        width: 150px;
      }
    }
    &:last-of-type {
      margin-right: 0px;
      margin-left: 15px;
    }
  }
`
export const Token = styled.img`
  max-width: 32px;
  width: 100%;
  height: auto;
`
