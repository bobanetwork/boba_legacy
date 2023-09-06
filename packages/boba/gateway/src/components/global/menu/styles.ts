import styled, { css } from 'styled-components'

export const StyleMenuButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 24px;
  border-radius: 33px;
  cursor: pointer;
  gap: 10px;
  background: ${({ theme }) =>
    theme.name === 'light' ? theme.colors.gray[50] : theme.colors.gray[400]};
`
