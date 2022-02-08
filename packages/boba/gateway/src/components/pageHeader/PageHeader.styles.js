import { styled } from '@mui/material/styles';
import { Box } from "@mui/material";

export const Wrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: 'flex-start',
  alignItems: 'center',
  margin: '20px 0',
  [theme.breakpoints.down('md')]: {
    marginTop: 0,
  },
  [theme.breakpoints.up('md')]: {
  },
}));
