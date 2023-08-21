import styled, { css } from 'styled-components'

export const Wrapper = styled.div`
  cursor: pointer;
  background: ${(props) => props.theme.colors.popup};
  border: 1px solid ${(props) => props.theme.colors.gray[300]};
  padding: 15px 25px;
  border-radius: 8px;
  &:hover {
    background: ${(props) => props.theme.colors.gray[300]};
  }
`

export const DropdownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  border-radius: 10px;
  text-align: center;
  background-color: ${(props) => props.theme.colors.box.background};
  position: absolute;
  right: 0px;
  top: -10px;
  max-width: 100px;
  button {
    justify-content: flex-start;
    padding: 5px 10px;
    border-radius: 8px;
    font-size: 12px;
    min-width: auto;
    background: rgba(0, 0, 0, 0);
    box-shadow: none;
  }

  ${({ theme: { colors, name } }) =>
    name === 'light'
      ? css`
          background: ${colors.gray[50]};
          border: 1px solid ${colors.gray[400]};
          color: ${colors.gray[800]};
          box-shadow: 2px 2px 25px 0px rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(7.5px);
          button {
            color: ${colors.gray[800]};
            &:hover {
              background: ${colors.gray[400]};
              color: ${colors.gray[800]};
            }
          }
        `
      : css`
          background: ${colors.gray[500]};
          border: 1px solid ${colors.gray[400]};
          color: ${colors.gray[100]};
          box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.15);
          button {
            color: ${colors.gray[300]};
            &:hover {
              background: ${colors.gray[400]};
              color: ${colors.gray[100]};
            }
          }
        `}
`

export const DropdownContent = styled.div`
  position: relative;
  display: flex;
  justify-content: flex-start;
  border-radius: 20px;
`

export const SvgContianer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
`
