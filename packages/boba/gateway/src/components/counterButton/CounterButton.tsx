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

import React from 'react'
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material'
import { IconButton } from '@mui/material'

type CounterButtonPropsType = {
  onClick: () => void
  disabled: boolean
  minus?: boolean
}

const CounterButton = (props: CounterButtonPropsType): JSX.Element => {
  const { onClick, disabled, minus } = props

  return (
    <IconButton
      color="primary"
      size="medium"
      disabled={disabled}
      onClick={onClick}
    >
      {minus ? (
        <RemoveCircleOutline fontSize="medium" />
      ) : (
        <AddCircleOutline fontSize="medium" />
      )}
    </IconButton>
  )
}

export default React.memo(CounterButton)
