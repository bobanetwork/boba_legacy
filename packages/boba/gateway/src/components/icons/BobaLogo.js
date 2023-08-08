import * as React from "react"
import { useTheme } from '@mui/material';
import { ReactComponent as LogoBoba2 } from 'assets/images/boba2/logo-boba2.svg';
import {ReactComponent as LogoBoba2dark} from 'assets/images/boba2/logo-boba2-dark.svg';

function BobaLogo() {

  const theme = useTheme();

  if (theme.palette.mode === 'dark') {
    return (
      <LogoBoba2 style={{width: '120px'}}/>
    )
  }

  return (
    <LogoBoba2dark style={{width: '120px'}}/>
  )
}

export default BobaLogo
