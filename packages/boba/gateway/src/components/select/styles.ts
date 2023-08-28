import styled from 'styled-components'

export const IconContainer = styled.div`
  display: 'flex';
  justify-content: 'center';
  align-items: 'center';
  height: 20px;
  width: 20px;
`

export const ValueContainer = styled.div`
  display: flex;
  padding: 10px;
  border-radius: 8px;
  align-items: center;
  gap: 10px;
  &:hover {
    background: ${({ theme }) => theme.bg.secondary};
  }
`

export const StyledMenu = styled.div`
  padding: 10px 5px;
  position: absolute;
`
export const SelectedContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 40px;
  border-radius: 10px;
  background: ${(props) => props.theme.palette.background.secondary};
`

export const Details = styled.div`
  text-align: left;
  margin-right: 10px;
`

export const Subtitle = styled.div`
  white-space: nowrap;
`
export const Field = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid ${(props) => props.theme.background.secondary};
  transition: all 200ms ease-in-out;
  border-radius: 12px;
`
export const Label = styled.div`
  margin-bottom: 10px;
`

export const SelectContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 100px;
`
