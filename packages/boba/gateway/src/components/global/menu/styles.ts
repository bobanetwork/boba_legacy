import styled from 'styled-components'

export const StyleMenuButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 24px;
  border-radius: 33px;
  gap: 10px;
  background: ${(props) => props.theme.colors.gray[400]};
  cursor: pointer;
`
