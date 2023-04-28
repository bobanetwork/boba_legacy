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

import React, { useState, useEffect } from 'react'
import { ContentCopyOutlined } from '@mui/icons-material'
import { IconButton, Tooltip } from '@mui/material'

type CopyType = {
  value?: string | null
}

const Copy = ({ value }: CopyType): JSX.Element => {
  const [open, setOpen] = useState(false)

  const handdleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setOpen(true)
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setOpen(false)
      }, 1500)
    }
  }, [open, setOpen])

  if (!value) {
    return <></>
  }

  return (
    <div onClick={() => handdleCopy(value)}>
      <Tooltip open={open} title="Copied to clipboard!">
        <IconButton size="medium">
          <ContentCopyOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </div>
  )
}

export default React.memo(Copy)
