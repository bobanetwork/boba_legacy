import { Typography } from '@mui/material';
import React from 'react';
import * as S from './PageHeader.styles';

const PageHeader = ({ title }) => {

  return (
    <S.Wrapper>
      <Typography variant="h1">{title}</Typography>
    </S.Wrapper>
  )
};

export default PageHeader;
