import * as React from "react"
import { useTheme } from '@mui/material'

function EthereumIcon({ selected = true }) {

  const theme = useTheme();

  const recColor = theme.palette.mode === 'light' ? '#031313' : '#ffffff'

  if (!selected) {
    return <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="30" rx="8" fill={recColor} fillOpacity="0.15" />
      <path d="M15.1376 5L15.0034 5.45578V18.6802L15.1376 18.8141L21.2761 15.1856L15.1376 5Z" fill="#E5E7EB" />
      <path d="M15.1387 5L9 15.1856L15.1387 18.8141V12.3953V5Z" fill="#F9F9FA" />
      <path d="M15.1376 19.9763L15.062 20.0685V24.7792L15.1376 25L21.2799 16.3496L15.1376 19.9763Z" fill="#E5E7EB" />
      <path d="M15.1387 25V19.9763L9 16.3496L15.1387 25Z" fill="#F9F9FA" />
      <path d="M15.1377 18.8139L21.2762 15.1853L15.1377 12.3951V18.8139Z" fill="#D2D5DA" />
      <path d="M9 15.1853L15.1387 18.8139V12.3951L9 15.1853Z" fill="#E5E7EB" />
    </svg>
  }

  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="30" rx="8" fill="#5B78ED" />
      <path d="M14.7514 4L14.6038 4.50135V19.0481L14.7514 19.1953L21.5037 15.204L14.7514 4Z" fill="#E5E7EB" />
      <path d="M14.7525 4L8 15.204L14.7525 19.1953V12.1348V4Z" fill="#F9F9FA" />
      <path d="M14.7514 20.4737L14.6682 20.5752V25.7569L14.7514 25.9998L21.5078 16.4844L14.7514 20.4737Z" fill="#E5E7EB" />
      <path d="M14.7525 25.9998V20.4737L8 16.4844L14.7525 25.9998Z" fill="#F9F9FA" />
      <path d="M14.7515 19.1951L21.5038 15.2038L14.7515 12.1345V19.1951Z" fill="#D2D5DA" />
      <path d="M8 15.2038L14.7525 19.1951V12.1345L8 15.2038Z" fill="#E5E7EB" />
    </svg>
  )
}

export default EthereumIcon
