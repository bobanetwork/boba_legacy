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
import { NavigateNext, NavigateBefore } from '@mui/icons-material'

import { useTheme } from '@mui/material'
import {
  PagerContainer,
  PagerContent,
  PagerLabel,
  PagerNavigation,
} from './styles'

interface PagerProps {
  currentPage: number
  totalPages: number
  isLastPage: boolean
  onClickNext: () => void
  onClickBack: () => void
  label: string
}

const Pager = ({
  currentPage,
  totalPages,
  isLastPage,
  onClickNext,
  onClickBack,
  label,
}: PagerProps): JSX.Element | null => {
  const theme = useTheme() as any
  const variant = theme.palette.mode === 'light' ? 'contained' : 'outlined'
  if (totalPages <= 1) {
    return null
  }

  return (
    <PagerContainer>
      <div>{label}</div>
      <PagerContent>
        <PagerLabel>{`Page ${currentPage} of ${totalPages}`}</PagerLabel>

        <PagerNavigation
          variant={variant}
          size="small"
          color="primary"
          disabled={currentPage === 1}
          onClick={onClickBack}
        >
          <NavigateBefore />
        </PagerNavigation>

        <PagerNavigation
          variant={variant}
          size="small"
          color="primary"
          disabled={isLastPage}
          onClick={onClickNext}
        >
          <NavigateNext />
        </PagerNavigation>
      </PagerContent>
    </PagerContainer>
  )
}

export default Pager
