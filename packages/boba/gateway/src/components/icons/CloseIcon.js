import * as React from "react"
import { useTheme } from "@mui/material/styles";

function CloseIcon() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const color = theme.palette.common[ isLight ? 'black' : 'white' ];
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M0.390441 15.4754C-0.130273 14.9547 -0.12999 14.1102 0.390441 13.5898L6.06201 7.91818L0.41988 2.27605C-0.100551 1.75562 -0.100834 0.911141 0.419879 0.390428C0.940593 -0.130286 1.78507 -0.130002 2.3055 0.390428L7.94763 6.03256L13.5898 0.390428C14.1102 -0.130002 14.9547 -0.130286 15.4754 0.390428C15.9961 0.911141 15.9958 1.75562 15.4754 2.27605L9.83325 7.91818L15.5048 13.5898C16.0253 14.1102 16.0255 14.9547 15.5048 15.4754C14.9841 15.9961 14.1396 15.9958 13.6192 15.4754L7.94763 9.8038L2.27606 15.4754C1.75563 15.9958 0.911154 15.9961 0.390441 15.4754Z"
        fill={color}
        fillOpacity="0.65" />
    </svg>

  )
}

export default CloseIcon
