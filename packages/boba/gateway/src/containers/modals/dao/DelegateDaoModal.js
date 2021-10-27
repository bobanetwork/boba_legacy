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

import React, { useState } from 'react';
import { useDispatch } from 'react-redux'

import { Box, Typography, useMediaQuery } from '@material-ui/core'
import { useTheme } from '@emotion/react'

import { closeModal, openAlert, openError } from 'actions/uiAction';
import { WrapperActionsModal } from 'components/modal/Modal.styles'

import Modal from 'components/modal/Modal'
import Input from 'components/input/Input'
import Button from 'components/button/Button'

import { delegateVotes } from 'actions/daoAction'

function DelegateDaoModal({ open }) {

    const [recipient, setRecipient] = useState('');
    const dispatch = useDispatch()

    const disabled = !recipient;

    const loading = false //ToDo useSelector(selectLoading([ 'DELEGATE_DAO/CREATE' ]))

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    function handleClose() {
        setRecipient('')
        dispatch(closeModal('delegateDaoModal'))
    }

    const submit = async () => {
        let res = await dispatch(delegateVotes({ recipient }));
        if (res) {
            dispatch(openAlert(`Votes delegated successfully!`));
            handleClose();
        } else {
            dispatch(openError(`Failed to delegate`));
            handleClose();
        }
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            maxWidth="md"
        >
        <Box>
            <Typography variant="h2" sx={{fontWeight: 700, mb: 2}}>
                Delegate Boba
            </Typography>
            <Box sx={{display: 'flex', flexDirection: 'column'}}>
                <Input
                    label='Delegate Address'
                    placeholder='Hash'
                    paste
                    value={recipient}
                    onChange={i => setRecipient(i.target.value)}
                />
            </Box>
        </Box>
        <WrapperActionsModal>
            <Button
                onClick={handleClose}
                color='neutral'
                size="large"
            >
                Cancel
            </Button>

            <Button
                onClick={()=>{submit()}}
                color='primary'
                variant="contained"
                tooltip={loading ? "Your delegation is still pending. Please wait for confirmation." : "Click here to delegate Boba voting power from one L2 address to another L2 address"}
                loading={loading}
                disabled={disabled}
                triggerTime={new Date()}
                fullWidth={isMobile}
                size="large"
            >
                Transfer
            </Button>
        </WrapperActionsModal>
        </Modal>
    )
}

export default React.memo(DelegateDaoModal)
