
import { useTheme } from '@emotion/react';
import { useMediaQuery } from '@mui/material';
import React from 'react';
import Earn from './Earn';

export default function EarnWrapper({ ...rest }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  return <Earn {...rest} isMobile={isMobile} />;
}
