import styled, { css } from 'styled-components'
import { sdesktop, tablet, mobile } from 'themes/screens'
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
  ${sdesktop(css`
    flex-direction: column;
    position: relative;
  `)}
  ${mobile(css`
    flex-direction: column;
  `)}
  > div {
    display: flex;
    margin: 0px auto;
    white-space: break-spaces;
    align-items: center;
    &:first-of-type {
      margin-left: 0px;
      width: 200px;
      margin-right: 10px;
      ${sdesktop(css`
        width: 100%;
      `)}
    }
    &:last-of-type {
      margin-right: 0px;
      margin-left: 15px;
      ${sdesktop(css`
        position: absolute;
        right: 20px;
        top: 35px;
      `)}
      ${tablet(css`
        top: 40px;
      `)}
      ${mobile(css`
        position: relative;
        top: auto;
        right: auto;
      `)}
    }
  }
`
export const Flex = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0px 10px;
  ${sdesktop(css`
    width: 100%;
    padding: 15px 150px 0px 0px;
  `)}
  ${mobile(css`
    width: 100%;
    flex-direction: column;
    padding: 15px 0px;
  `)}
  > div {
    display: flex;
    gap: 0px 5px;
    white-space: initial;
    ${tablet(css`
      flex-direction: column;
    `)}
    ${mobile(css`
      width: 100%;
      flex-direction: row;
      justify-content: space-between;
    `)}
  }
`
export const Token = styled.img`
  max-width: 32px;
  width: 100%;
  height: auto;
  margin-right: 10px;
`
