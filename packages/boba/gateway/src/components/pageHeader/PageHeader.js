import React from 'react';
import { Box, Typography, useMediaQuery } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import * as S from './PageHeader.styles'

const PageHeader = ({ title }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <S.Wrapper>
      <Typography variant="h1">{title}</Typography>
    </S.Wrapper>
  )
};

export default PageHeader;
