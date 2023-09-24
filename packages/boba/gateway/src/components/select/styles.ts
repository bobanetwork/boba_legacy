import styled, { css } from 'styled-components'

export const IconContainer = styled.div`
  display: 'flex';
  justifycontent: 'center';
  alignitems: 'center';
  height: 20px;
  width: 20px;
`

export const ValueContainer = styled.div<{ active?: boolean }>`
  display: flex;
  padding: 10px;
  border-radius: 8px;
  align-items: center;
  gap: 10px;
  ${({ active }) =>
    active &&
    css`
      background: ${({ theme }) => theme.bg.secondary};
    `}
  &:hover {
    background: ${({ theme }) => theme.bg.secondary};
  }
`
export const OptionContainer = styled.div``

export const StyledMenu = styled.div`
  padding: 10px 5px;
  postion: absolute;
`
