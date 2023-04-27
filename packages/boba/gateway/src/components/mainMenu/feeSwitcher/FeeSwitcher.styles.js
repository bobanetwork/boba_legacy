import styled from '@emotion/styled'
import { Box, Typography } from '@mui/material'
import {HelpOutline} from "@mui/icons-material";

export const FeeSwitcherWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  my: 1,
  gap: '5px',

  [theme.breakpoints.down('md')]: {
    marginTop: '30px',
  },
}))

export const FeeSwitcherLabel = styled(Typography)(({ theme }) => ({
  whiteSpace: 'nowrap',
  color: theme.palette.primary.info,
}))

export const FeeSwitcherIcon = styled(HelpOutline)(({ theme }) => ({
  color: theme.palette.primary.info,
}))
