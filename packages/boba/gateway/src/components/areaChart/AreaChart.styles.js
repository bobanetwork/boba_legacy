import { styled } from "@mui/styles";
import { Box } from "@mui/material";

export const AreaChartContainer = styled(Box)(({ theme }) => ({
  background: 'transperent'
}))

export const ToolTipContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  background: theme.palette.background.secondary
}))
