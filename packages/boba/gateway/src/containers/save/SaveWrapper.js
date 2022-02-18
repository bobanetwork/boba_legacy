
import { useTheme } from '@emotion/react';
import { useMediaQuery } from '@material-ui/core';
import React from 'react';
import Save from './Save';

export default function SaveWrapper({ ...rest }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  return <Save {...rest} isMobile={isMobile} />;
}
