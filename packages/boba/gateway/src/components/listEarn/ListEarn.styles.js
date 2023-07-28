import styled  from 'styled-components'

export const Wrapper = styled.div`
  cursor: pointer;
  background: ${(props) => props.theme.colors.popup};
  border: 1px solid ${(props) => props.theme.colors.gray[300]};
  padding: 15px 25px;
  border-radius: 8px;
  &:hover {
    background: ${(props) => props.theme.colors.gray[300]};
  }
`;

export const DropdownWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  width: 100%;
  padding: 10px 15px;
  margin-top: 10px;
  border-radius: 10px;
  text-align: center;
  background-color: ${(props) => props.theme.colors.box.background};
`

export const DropdownContent = styled.div`
  display: flex;
  justify-content: flex-start;
  border-radius: 20px;
  margin: 5px;
  padding: 10px 10px 0px 10px;
`