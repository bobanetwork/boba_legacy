import { Divider, Grid } from "@mui/material";
import { styled } from '@mui/material/styles';


export const ListNFTItem = styled(Grid)(({ theme,active }) => ({
  borderRadius: '20px',
  maxWidth: '180px',
  minWidth: '180px',
  margin: '10px',
  background: theme.palette.background.secondary,
  overflow: 'hidden',
  border: '1px solid transparent',
  '&: hover': {
    border: '1px solid transparent',
    borderImage: 'linear-gradient(118deg, #CBFE00 0%, #1cd6d1 100%)',
    borderImageSlice: 1,
  },
  borderImage: active ? 'linear-gradient(118deg, #CBFE00 0%, #1cd6d1 100%)' : 'none',
  borderImageSlice: 1,
  padding: active ? '10px' : '0px',
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
