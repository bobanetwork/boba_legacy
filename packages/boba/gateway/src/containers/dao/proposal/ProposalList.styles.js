import { Box, Divider } from "@mui/material";
import { styled } from "@mui/styles";

export const DividerLine = styled(Divider)(({ theme }) => ({
  background: `${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(3, 19, 19, 0.04)'}`,
  boxSizing: 'border-box',
  boxShadow: `${theme.palette.mode === 'dark' ? '0px 4px 4px rgba(0, 0, 0, 0.25)' : 'none'}`,
  width: '100%'
}))

export const DaoProposalHead = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  justifyContent: 'space-between',
  padding: '24px 0px',
  width: '100%',
  margin: '5px',
  [theme.breakpoints.down('sm')]: {
    padding: '0px',
  },
}));

export const DaoProposalListContainer = styled(Box)(({ theme }) => ({
  overflowY: 'auto',
  margin: '10px auto',
  borderRadius: '8px',
  padding: '20px 10px',
  width: '100%',
  height: '600px',
  '.loadingContainer' : {
    padding: '10px auto',
  },
  [theme.breakpoints.down('sm')]: {
    padding: '0px',
  },
}));
