import styled from '@emotion/styled';

export const ThemeSwitcherTag = styled.div`
  display: flex;
  position: relative;
`;

export const Button = styled.button`
  border: 0;
  padding: 10px;
  border-radius: 16px;
  background-color: ${(props) => props.selected ? props.theme.palette.action.disabledBackground : 'transparent'};
  cursor: pointer;
  transition: all .2s ease-in-out;
  z-index: 5;
`;
