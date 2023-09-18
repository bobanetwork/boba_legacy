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

import { Fade, Container, Box } from '@mui/material'

import { Heading } from 'components/global'
import * as S from './styles'
import CloseIcon from 'assets/images/close.svg'
import { Svg } from 'components/global/svg'
import { ModalInterface } from './types'

const _Modal = ({
  children,
  open,
  onClose,
  title,
  transparent,
  maxWidth,
  minHeight,
  isMobile = false,
  newStyle = false,
}: ModalInterface) => {
  return (
    <S.StyledModal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      open={open}
      onClose={onClose}
      disableAutoFocus={true}
    >
      <Fade in={open}>
        <Container sx={{ maxWidth: '450px !important' }}>
          <S.Style transparent={!!transparent || !!isMobile}>
            <Box display="flex" flexDirection="column" gap="10px">
              <S.ModalHead>
                <S.TitleContainer>
                  <Heading variant="h2">{title}</Heading>
                  <S.IconButtonTag onClick={onClose}>
                    <Svg src={CloseIcon} fill="#fff" />
                  </S.IconButtonTag>
                </S.TitleContainer>
              </S.ModalHead>
              <S.Content>{children}</S.Content>
            </Box>
          </S.Style>
        </Container>
      </Fade>
    </S.StyledModal>
  )
}

export default _Modal
