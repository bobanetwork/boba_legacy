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
import React from 'react';
import { useDispatch } from 'react-redux';

import { Box, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/styles';
import { setBridgeType } from 'actions/bridgeAction';
import { closeModal } from 'actions/uiAction';
import Button from 'components/button/Button';
import Modal from 'components/modal/Modal';
import * as LayoutS from 'components/common/common.styles';

import * as S from './bridgeTypeModal.styles';

function BridgeTypeModal({ open, toBridgeType }) {

  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))


  function handleClose() {
    dispatch(closeModal('bridgeTypeSwitch'))
  }


  return (
    <Modal open={open} onClose={handleClose} maxWidth="sm" minHeight="400px">
      <Box>
        <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
          Switch bridge mode
        </Typography>
        <LayoutS.DividerLine sx={{ my: 1 }} />
        <Typography variant="body2">
          The classic bridge only supports the transfer of one token. Are you sure you want to switch?
        </Typography>
      </Box>
      <S.WrapperActionsModal>
        <Button
          onClick={handleClose}
          color='primary'
          variant="outlined"
          fullWidth={isMobile}
          size="large"
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            dispatch(setBridgeType(toBridgeType))
            handleClose();
          }}
          color='primary'
          variant="contained"
          fullWidth={isMobile}
          size="large"
        >
          Switch
        </Button>
      </S.WrapperActionsModal>
    </Modal>
  )
}

export default React.memo(BridgeTypeModal);
