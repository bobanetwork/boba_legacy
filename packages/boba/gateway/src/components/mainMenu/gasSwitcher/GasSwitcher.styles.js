import styled from '@emotion/styled';
import { Typography, Box } from '@mui/material';

export const WalletPickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  margin-left: -5px;
  @include mobile {
    font-size: 0.9em;
    padding: 10px;
  }
`;

export const Label = styled(Typography)(({ theme }) => ({
  marginLeft: theme.spacing(2),
  opacity: '0.65',
  [ theme.breakpoints.down('md') ]: {
    marginLeft: theme.spacing(0),
  }
}));

export const Value = styled(Typography)(({ theme }) => ({
  opacity: '0.85'
}));

export const WalletPickerWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  @include mobile {
    flex-direction: column;
  }
  img {
    height: 20px;
  }
`;

export const Menu = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  zIndex: 1000,
  position: 'relative',
  'a': {
    cursor: 'pointer',
  },
  [ theme.breakpoints.down('md') ]: {
    width: '100%',
    flexDirection: 'column'
  }
}))


export const MenuItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  gap: '5px',
  'p': {
    whiteSpace: 'nowrap',
  },
  [ theme.breakpoints.down('md') ]: {
    width: '100%',
    justifyContent: 'flex-start',
  }
}))

export const Chevron = styled.img`
  transform: ${props => props.open ? 'rotate(-90deg)' : 'rotate(90deg)'};
  transition: all 200ms ease-in-out;
  height: 20px;
  margin-bottom: 0;
`;

export const NetWorkStyle = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: ${(props) => props.walletEnabled !== false ? 'inherit' : 'pointer'};
`;
