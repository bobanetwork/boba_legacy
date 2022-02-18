import styled from '@emotion/styled';
import { Box } from '@material-ui/core';

export const Menu = styled.div`
  //flex: 0 0 320px;
  display: flex;
  width: 100%;
  height: 100px;
  gap: 20px;
  justify-content: flex-start;
  align-items: center;
  //260px;
  padding-top: 20px;
  padding-left: 20px;
  padding-bottom: 20px;
  //background: red;
  ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
    margin-left: -40px;
  }
  > a {
    margin-bottom: 50px;
    display: flex;
  }
`
export const MobileNavTag = styled(Box)`
  width: 100%;
  //padding: 20px 0 40px 0;
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
`;

export const StyleDrawer = styled(Box)`
  background-color: ${(props) => props.theme.palette.mode === 'light' ? 'white' : '#061122' };
  height: 100%;
`;

export const DrawerHeader = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding: 40px 40px 20px 40px;
`;

export const WrapperCloseIcon = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
