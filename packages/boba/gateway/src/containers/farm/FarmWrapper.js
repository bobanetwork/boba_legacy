
import { useTheme } from '@emotion/react';
import { useMediaQuery } from '@mui/material';
import React from 'react';
import Farm from './Farm';

export default function FarmWrapper({ ...rest }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  return <Farm {...rest} isMobile={isMobile} />;
}
