import * as React from 'react'
import { useTheme } from '@mui/material'

function FantomIcon({ selected = true }) {
  const theme = useTheme()

  const recColor = theme.palette.mode === 'light' ? "#d2d4d4" : "#3d3e40"

  if (!selected) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
        <rect fill={recColor} fillOpacity="1" width="30" height="30" rx="8"/>
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
            <path d="M16 32c8.837 0 16-7.163 16-16S24.837 0 16 0 0 7.163 0 16s7.163 16 16 16z" fill={recColor}/>
            <path fillRule="evenodd" clipRule="evenodd" d="M17.2 12.9l3.6-2.1V15l-3.6-2.1zm3.6 9L16 24.7l-4.8-2.8V17l4.8 2.8 4.8-2.8v4.9zm-9.6-11.1l3.6 2.1-3.6 2.1v-4.2zm5.4 3.1l3.6 2.1-3.6 2.1v-4.2zm-1.2 4.2L11.8 16l3.6-2.1v4.2zm4.8-8.3L16 12.2l-4.2-2.4L16 7.3l4.2 2.5zM10 9.4v13.1l6 3.4 6-3.4V9.4L16 6l-6 3.4z" fill="#fff"/>
          </svg>
      </svg>
    )
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
      <rect fill="#13B5EC" fillOpacity="1" width="30" height="30" rx="8"/>
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
          <path d="M16 32c8.837 0 16-7.163 16-16S24.837 0 16 0 0 7.163 0 16s7.163 16 16 16z" fill="#13B5EC"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M17.2 12.9l3.6-2.1V15l-3.6-2.1zm3.6 9L16 24.7l-4.8-2.8V17l4.8 2.8 4.8-2.8v4.9zm-9.6-11.1l3.6 2.1-3.6 2.1v-4.2zm5.4 3.1l3.6 2.1-3.6 2.1v-4.2zm-1.2 4.2L11.8 16l3.6-2.1v4.2zm4.8-8.3L16 12.2l-4.2-2.4L16 7.3l4.2 2.5zM10 9.4v13.1l6 3.4 6-3.4V9.4L16 6l-6 3.4z" fill="#fff"/>
        </svg>
    </svg>
  )
}

export default FantomIcon
