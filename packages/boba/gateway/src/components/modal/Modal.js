/*
Copyright 2019-present OmiseGO Pte Ltd

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
import BobaGlassIcon from 'components/icons/BobaGlassIcon'

import {
  Fade,
  Typography,
  Container,
  Box,
  useMediaQuery,
  Grid
} from '@mui/material'

import * as S from "./Modal.styles"
import * as LayoutS from 'components/common/common.styles';
import { useTheme } from '@emotion/react'
import { HighlightOffOutlined } from '@mui/icons-material';
import CloseIcon from 'components/icons/CloseIcon';

function _Modal({
  children,
  open,
  onClose,
  light,
  title,
  transparent,
  maxWidth,
  minHeight,
  newStyle = false
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <S.StyledModal
      aria-labelledby='transition-modal-title'
      aria-describedby='transition-modal-description'
      open={open}
      onClose={onClose}
      ismobile={isMobile ? 1 : 0}
      // closeAfterTransition
      BackdropComponent={S.Backdrop}
      disableAutoFocus={true}
    >
      <Fade in={open}>

        {
          !!newStyle ?
            <Container maxWidth={maxWidth || "lg"} sx={{ border: 'none', position: 'relative' }}>
              <S.Style minHeight={minHeight || '430px'} isMobile={isMobile} transparent={transparent || isMobile}>
                <Box display="flex" flexDirection="column" gap="10px">
                  <S.ModalHead>
                    <Box display="flex" alignItems="center" gap="10px">
                      <BobaGlassIcon />
                      <Typography variant="body1" sx={{ fontWeight: "700" }}>{title}</Typography>
                    </Box>
                    <S.IconButtonTag onClick={onClose}>
                      <HighlightOffOutlined sx={{ opacity: 0.5 }} />
                    </S.IconButtonTag>
                  </S.ModalHead>
                  <LayoutS.DividerLine sx={{ my: 1 }} />
                  <S.Content>
                    {children}
                  </S.Content>
                </Box>
              </S.Style>
            </Container>
            : <Container maxWidth={maxWidth || "lg"} sx={{ border: 'none', position: 'relative' }}>
              <Grid container>
                <Grid item xs={12} md={title ? 2 : 1}>
                  <Box sx={{ mr: 8 }}>
                    <Typography variant="h2" component="h3" sx={{ fontWeight: "700" }}>{title}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={title ? 10 : 9}>
                  <S.Style minHeight={minHeight || '430px'} isMobile={isMobile} transparent={transparent || isMobile}>
                    {children}
                  </S.Style>
                </Grid>

                <Grid item xs={12} md={1}>
                  <S.IconButtonTag onClick={onClose}>
                    <CloseIcon />
                  </S.IconButtonTag>
                </Grid>

              </Grid>
            </Container>
        }
      </Fade>
    </S.StyledModal>
  );
}

export default _Modal;
