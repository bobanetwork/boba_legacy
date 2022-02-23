import * as React from "react"
import { useTheme } from "@mui/material/styles";

function NavIcon({ onClick }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const color = theme.palette.common[ isLight ? 'black' : 'white' ];

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path d="M6.66376 9.31799C5.92776 9.31799 5.33043 9.91493 5.33043 10.6513C5.33043 11.3877 5.92776 11.9847 6.66376 11.9847H25.3304C26.0664 11.9847 26.6638 11.3877 26.6638 10.6513C26.6638 9.91493 26.0664 9.31799 25.3304 9.31799H6.66376ZM11.9971 14.6513C11.2611 14.6513 10.6638 15.2483 10.6638 15.9847C10.6638 16.7211 11.2611 17.318 11.9971 17.318H25.3304C26.0664 17.318 26.6638 16.7211 26.6638 15.9847C26.6638 15.2483 26.0664 14.6513 25.3304 14.6513H11.9971ZM17.3304 19.9847C16.5944 19.9847 15.9971 20.5816 15.9971 21.318C15.9971 22.0544 16.5944 22.6513 17.3304 22.6513H25.3304C26.0664 22.6513 26.6638 22.0544 26.6638 21.318C26.6638 20.5816 26.0664 19.9847 25.3304 19.9847H17.3304Z"
        fill={color}
        fillOpacity="0.85" />
    </svg>

  )
}

export default NavIcon
