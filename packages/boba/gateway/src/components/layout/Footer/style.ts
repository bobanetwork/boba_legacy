import styled from 'styled-components'

export const StyledFooter = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 0px 32px;
`

export const DividerLine = styled.hr`
  border-color: ${({ theme }) => theme.colors['gray'][200]};
  box-sizing: border-box;
  width: 100%;
`
