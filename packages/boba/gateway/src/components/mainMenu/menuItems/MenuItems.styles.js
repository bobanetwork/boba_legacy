// import styled from "@emotion/styled";
import { Box } from '@material-ui/core'
import { styled } from '@material-ui/core/styles'

export const Nav = styled('nav')(({ theme }) => ({
  //padding: '12px',
  width: '400px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-start', 
  alignItems: 'center', 
  gap: '10px',
  flexWrap: 'wrap',
  [theme.breakpoints.down('md')]: {
    //width: "100%",
    //backgroundColor: theme.palette.background.default,
  },
  [theme.breakpoints.up('md')]: {
    //paddingTop: '30px',
    //display: 'flex',
    //flexDirection: 'row',
  },
}))

export const MenuItem = styled(Box)`
  color: ${props => props.selected ? props.theme.palette.secondary.main : "inherit"};
  background: ${props => props.selected ? 'linear-gradient(90deg, rgba(237, 72, 240, 0.09) 1.32%, rgba(237, 72, 236, 0.0775647) 40.2%, rgba(240, 71, 213, 0) 71.45%)' : 'none'};
  //display: flex;
  //flex-direction: row;
  font-size: 0.8em;
  //align-items: center;
  //padding: 5px;
  //padding-left: 20px;
  //position: relative;
  //margin-bottom: 1px;
  font-weight: ${props => props.selected ? 700 : 'normal'};
  cursor: pointer;
  //&:hover {
  //  color: ${props => props.theme.palette.secondary.main};
  //}
  // &:before {
  //   width: 5px;
  //   height: 100%;
  //   left: 0;
  //   top: 0;
  //   position: absolute;
  //   content: '';
  //   background-color: #506DFA;
  //   opacity: 0.6;
  //   display: ${props => props.selected ? 'block' : 'none'};
  // }
`
// export const Chevron = styled.img`
//   transform: ${props => props.open ? 'rotate(-90deg)' : 'rotate(90deg)'};
//   transition: all 200ms ease-in-out;
//   height: 20px;
//   margin-bottom: 0;
// `;
