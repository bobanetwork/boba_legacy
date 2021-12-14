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
import { useDispatch } from 'react-redux';

import { closeModal, openAlert, openError } from 'actions/uiAction';
import { transferDao } from 'actions/daoAction';

import Modal from 'components/modal/Modal'
import Button from 'components/button/Button'
import Input from 'components/input/Input'

import { Box, Typography, useMediaQuery } from '@material-ui/core'
import { useTheme } from '@emotion/react'
import { WrapperActionsModal } from 'components/modal/Modal.styles'

function TransferDaoModal({ open = false }) {

    const [recipient, setRecipient] = useState('')
    const [amount, setAmount] = useState('')
    const dispatch = useDispatch()

    const loading = false //ToDo useSelector(selectLoading([ 'TRANSFER_DAO/CREATE' ]))

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    function handleClose() {
        setRecipient('')
        setAmount('')
        dispatch(closeModal('transferDaoModal'))
    }

    const submit = async () => {
        let res = await dispatch(transferDao({recipient, amount}));

        if(res) {
            dispatch(openAlert(`Governance token transferred`))
            handleClose()
        } else {
            dispatch(openError(`Failed to transfer governance token`))
            handleClose()
        }
    }

    const disabledTransfer = amount <= 0 || !recipient;

    return (
        <Modal
            open={open}
            onClose={handleClose}
            maxWidth="md"
        >
        <Box>
            <Typography variant="h2" sx={{fontWeight: 700, mb: 2}}>
                Transfer Boba
            </Typography>
            <Box sx={{display: 'flex', flexDirection: 'column'}}>
                <Input
                    placeholder='Recipient address on the Boba L2 (0x...)'
                    value={recipient}
                    onChange={i => setRecipient(i.target.value)}
                    fullWidth
                    paste
                    sx={{fontSize: '50px', marginBottom: '20px'}}  
                />
                <Input
                    label='Amount to Transfer'
                    value={amount}
                    type="number"
                    onChange={(i) => { setAmount(i.target.value) }}
                    variant="standard"
                    newStyle
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
                tooltip={loading ? "Your transaction is still pending. Please wait for confirmation." : "Click here to transfer BOBA from one L2 address to another L2 address"}
                loading={loading}
                disabled={disabledTransfer}
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

export default React.memo(TransferDaoModal)
