/*
Copyright 2021-present Boba Network.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import React, { ReactNode } from 'react'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert, { AlertColor } from '@mui/material/Alert'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Error from '@mui/icons-material/Error'
import { useDispatch, useSelector } from 'react-redux'
import { selectAlert, selectError } from 'selectors'
import { closeAlert, closeError } from 'actions/uiAction'

interface ToastProps {
  children: ReactNode
  open: boolean
  onClose: () => void
  type: AlertColor
  duration: number
}

const Toast = ({
  children,
  open,
  onClose,
  type = 'success',
  duration = 9000,
}: ToastProps) => {
  let autohide = 0
  if (type === 'success') {
    autohide = 3000 // autohide all the green alerts
  } else {
    autohide = duration
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={autohide ? autohide : undefined}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      style={{ marginTop: 50 }}
    >
      <MuiAlert
        onClose={onClose}
        severity={type}
        variant="filled"
        sx={{
          wordWrap: 'break-word',
          borderRadius: '10px',
        }}
        iconMapping={{
          error: <Error sx={{ color: '#FFD88D' }} />,
          success: <CheckCircle sx={{ color: '#FFD88D' }} />,
        }}
      >
        {children}
      </MuiAlert>
    </Snackbar>
  )
}

/**
 *
 * @NotificationAlert: component is used to show the success & error message.
 *
 *
 */

const NotificationAlert = () => {
  const dispatch = useDispatch<any>()
  const errorMessage = useSelector(selectError)
  const alertMessage = useSelector(selectAlert)

  const handleErrorClose = () => dispatch(closeError())
  const handleAlertClose = () => dispatch(closeAlert())

  return (
    <>
      <Toast
        type="error"
        duration={0}
        open={!!errorMessage}
        onClose={handleErrorClose}
      >
        {errorMessage}
      </Toast>

      <Toast
        type="success"
        duration={0}
        open={!!alertMessage}
        onClose={handleAlertClose}
      >
        {alertMessage}
      </Toast>
    </>
  )
}

export default NotificationAlert
