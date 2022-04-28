import styled from "styled-components";
import { InputAdornment, StepLabel } from "@mui/material";
import { muiTheme } from "../mui.theme";

const primaryColor = '#ccff00'

export const H1 = styled.h1`
  color: ${primaryColor};
  margin-bottom: 0.2em;
`

export const P = styled.p`
  font-size: 0.7em;
  text-align: center;
`

export const SmallerParagraph = styled.p`
  font-size: 0.55em;
  text-align: center;`

export const Body = styled.div`
  align-items: center;
  color: white;
  background-color: black;
  display: flex;
  flex-direction: column;
  font-size: calc(10px + 2vmin);
  justify-content: center;
  margin-top: 40px;
`;

export const StyledInputAdornment = styled(InputAdornment)({
  'p[class*="MuiTypography-root"]': {
    color: muiTheme.palette.primary.main,
  }
})

export const StyledStepLabel = styled(StepLabel)({
  'span[class*="MuiStepLabel-label Mui-active"]': {
    color: muiTheme.palette.primary.main,
  },
  '&.Mui-disabled .MuiStepLabel-label, span[class*="MuiStepLabel-label Mui-completed"]': {
    color: muiTheme.palette.secondary.contrastText,
  },
  '.MuiSvgIcon-root circle:not(.Mui-active circle)': {color: muiTheme.palette.secondary.contrastText},
})

export const CustomButton = styled.button`
  background-color: white;
  border: none;
  border-radius: 8px;
  color: #000000;
  cursor: pointer;
  font-size: 16px;
  margin: 0px 20px;
  padding: 12px 24px;
  text-align: center;
  text-decoration: none;

  :disabled {
    background-color: #888;
    color: #222;
    cursor: not-allowed;
  }
`;

export const Container = styled.div`
  background-color: #000000;
  display: flex;
  flex-direction: column;
  height: calc(100vh);
`;

export const Header = styled.header`
  align-items: center;
  background-color: #000000;
  color: white;
  display: flex;
  flex-direction: row;
  min-height: 70px;
`;

export const HeaderCol = styled.div`
  flex-direction: column;
  width: 50%;
`

export const Image = styled.img`
  pointer-events: none;
`;

export const Link = styled.a.attrs({
  target: "_blank",
  rel: "noopener noreferrer",
})`
  color: #61dafb;
  margin-top: 8px;
`;
