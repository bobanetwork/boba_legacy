import { styled } from '@material-ui/core/styles';
import { Box } from "@material-ui/core";

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
