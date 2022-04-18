import { createTheme, Theme } from "@mui/material";

export const muiTheme: Theme = createTheme({
  palette: {
    primary: {
      main: '#ccff00',
      contrastText: '#000',
    },
    secondary: {
      main: '#000',
      contrastText: '#fff',
    }
  }
});
