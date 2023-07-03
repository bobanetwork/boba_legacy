import styled from '@emotion/styled'
import { Box } from '@mui/material'
import { style } from '@mui/system';

export const HistoryContainer = styled.div`
  background: ${props => props.theme.palette.background.glassy};
  border-radius: 8px;
  margin-bottom: 20px;
`;

export const HistoryPageContainer = styled(Box)(({ theme }) => ({
  margin: '0px auto',
  marginBottom: theme.palette.spacing.toFooter,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-around',
  padding: '10px',
  paddingTop: '0px',
  width: '70%',
  [theme.breakpoints.between('md', 'lg')]: {
    width: '90%',
    padding: '0px',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    width: '90%',
    padding: '0px',
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    padding: '0px',
  },
}))

export const SearchContainer = styled(Box)(({ theme }) => ({
  width:'100%',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'space-between'
}));

export const DatePickerContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  fontSize: '14px'
}));

export const Disclaimer = styled.div`
  margin: 5px 10px;
  margin-top: 20px;
`;

export const Content = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  marginBottom: '10px',
  padding: '10px 20px',
  borderRadius: '6px'
}));

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
}))



export const LayerAlert = styled(Box)(({ theme }) => ({
  width: "100%",
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '30px',
  borderRadius: '8px',
  margin: '20px 0px',
  padding: '25px',
  background: theme.palette.background.secondary,
  [theme.breakpoints.up('md')]: {
    padding: '25px 50px',
  },

}));


export const Table = styled(Box)(({theme}) =>({
  Gradient: 'Linear #303030-#252525',
  // Opacity: 60%,
  // lightest- top left corner ,
  // darkest- bottom right corner ,
  // Outline: Gray 300,
  // Background blur: 15,
  // Shadow: #000000-25%
              //  X-0 Y-2 Blur-4
              // (Bridge Shadow),
  borderRadius: '6px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  textAlign: 'center',
  width: '100%',
  [ theme.breakpoints.down('sm') ]: {
    gap: '10px'
  },
  background: theme.palette.background.secondary,
  [theme.breakpoints.down('md')]: {
    marginBottom: "5px",
  },
}))

export const TableFilters = styled(Box)(({ theme }) => ({
  padding: "20px",
  borderTopLeftRadius: "6px",
  borderTopRightRadius: "6px",
  justifyContent: 'space-between',
  width: "100%",
  display: "flex",
  flexDirection: 'row',
  alignItems: "flex-start",
  background: theme.palette.background.secondary,
  [theme.breakpoints.down('md')]: {
    marginBottom: "5px",
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '20px',
  },
}))


export const NetworkDropDowns = styled(Box)(({theme}) => ({
  // width: "30%",
  display: "flex",
  flexDirection: 'row',
  alignItems: "center",
  justifyContent: "center",
  gap:'16px',
  // padding: "20px",
  fontSize:"16px"
}))

export const TableHeadings = styled(Box)(({ theme }) => ({
  padding: "20px",
  width:"100%",
  display: "flex",
  flexDirection: "row",
  fontSize:"12px",
  alignItems: "flex-start",
  justifyContent: "space-between",
}))

export const TableContent = styled(Box)(({ theme }) => ({
  padding: "20px",
  width:"100%",
  display: "flex",
  flexDirection: "row",
  fontSize:"12px",
  alignItems: "flex-start",
  justifyContent: "space-between",
}))

// Gradient: Linear #303030-#252525
// Opacity: 60%
// lightest- top left corner 
// darkest- bottom right corner 
// Outline: Gray 300
// Background blur: 15
// Shadow: #000000-25%
//                X-0 Y-2 Blur-4
//               (Bridge Shadow)