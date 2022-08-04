import React from 'react'
import { Box, Typography, useTheme } from '@mui/material';
import { components } from 'react-select';
import * as G from 'containers/Global.styles';
import * as S from './Select.style';

export const Option = (props) => {

  const {
    icon,
    title,
    label,
    subTitle
  } = props.data;

  return <>
    <components.Option {...props}>
      <S.SelectOptionContainer p={2} gap={2}>
        {icon && <Box display='flex'>
          <G.ThumbnailContainer px={2} py={1}>
            <img src={icon} alt={title} />
          </G.ThumbnailContainer>
        </Box>}
        <Box>
          {label && <Typography variant="body1">{label}</Typography>}
          {title && <Typography variant="body2" style={{ opacity: 0.6 }}>{title}</Typography>}
          {subTitle && <Typography variant="body2" style={{ opacity: 0.6 }}>{subTitle}</Typography>}
        </Box>
      </S.SelectOptionContainer>
    </components.Option>
  </>
}


export const MultiValue = (props) => {

  return <>
    <components.MultiValue {...props}>
      <Typography variant="body2">{props.data.label}</Typography>
    </components.MultiValue>
  </>
}
export const SingleValue = (props) => {

  return <>
    <components.SingleValue  {...props}>
      <Typography variant="body2">{props.data.label}</Typography>
    </components.SingleValue>
  </>
}
