import styled from '@emotion/styled';
import {Box} from '@material-ui/core'

export const HistoryContainer = styled.div`
  background: ${props => props.theme.palette.background.secondary};
  border-radius: 8px;
  margin-bottom: 20px;
`;

export const Disclaimer = styled.div`  
  margin: 5px 10px;
  margin-top: 20px;
`;

export const Content = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 10px;
  padding: 10px 20px;
  border-radius: 6px;
`;

export const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '20px',
  },
}));
