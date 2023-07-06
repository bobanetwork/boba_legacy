import styled from 'styled-components'

export const TabHeader = styled.div`
  display: flex;
  justify-content: space-between;
  background: ${(props) => props.theme.colors.gray[400]};
  border-radius: 8px;
  padding: 5px;
`

export const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: 32px;
  gap: 32px 0px;
`

export const TabIndex = styled.div<{
  active?: boolean
}>`
  width: 100%;
  padding: 8px 30px 8px 30px;
  text-align: center;
  cursor: pointer;
  border-radius: 8px;
  font-weight: bold;
  font-size: ${(props) => props.theme.text.body2};
  background: transparent;
  ${(props) =>
    props.active &&
    `
    color:${props.theme.colors.gray[600]};
    background:${props.theme.colors.green[300]};

  `};
`
