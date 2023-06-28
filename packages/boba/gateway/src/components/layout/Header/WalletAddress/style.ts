import styled from 'styled-components'

export const AddressContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 24px;
  border-radius: 33px;
  gap: 10px;
  background: ${(props) => props.theme.colors.gray[400]};
  cursor: pointer;
`

export const CircleIndicator = styled.div`
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #0787af;
`
