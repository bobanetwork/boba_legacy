import { Divider, Grid } from "@mui/material";
import { styled } from '@mui/material/styles';


export const ListNFTItem = styled(Grid)(({ theme, active }) => ({
  borderRadius: '10px',
  maxWidth: '200px',
  minWidth: '200px',
  background: theme.palette.background.secondary,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-around',
  alignItems: 'flex-start',
  //gap: '30px',
  border: '1px solid transparent',
  padding: active ? '10px' : '0px',
  minHeight: '250px',
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    maxWidth: '160px',
    margin: '10px auto',
    'p': {
      whiteSpace: 'normal',
    }
  },
}));

export const DividerLine = styled(Divider)(({ theme }) => ({
  background: `${ theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(3, 19, 19, 0.04)'}`,
  boxSizing: 'border-box',
  boxShadow: `${ theme.palette.mode === 'dark' ? '0px 4px 4px rgba(0, 0, 0, 0.25)' : 'none'}`,
  width: '100%'
}))
