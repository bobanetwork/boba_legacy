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

import networkService from 'services/networkService'

function DelegateDaoModal({ open }) {

    const [recipient, setRecipient] = useState('');
    const dispatch = useDispatch()

    const disabled = !recipient;

    const loading = false //ToDo useSelector(selectLoading([ 'DELEGATE_DAO/CREATE' ]))

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    const wAddress = networkService.account ? networkService.account : ''

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

    const submitMe = async () => {
        let res = await dispatch(delegateVotes({ recipient: wAddress }))
        if (res) {
            dispatch(openAlert(`Vote self-delegation successfull!`))
            handleClose();
        } else {
            dispatch(openError(`Failed to delegate`))
            handleClose();
        }
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            maxWidth="md"
        >
            <Typography variant="h2" sx={{fontWeight: 700, mb: 2}}>
                Delegate my BOBA votes
            </Typography>
            <Box style={{border: '1px solid #5E6170', padding: '10px', margin: '10px', borderRadius: '4px', background: theme.palette.background.secondary}}>
                <Typography variant="h3" sx={{mb: 1}}>
                    Delegate my BOBA votes to myself
                </Typography>
                <Typography variant="body3" style={{fontSize: '0.8em', lineHeight: '1.0em'}}>
                    My address:&nbsp;
                    <span
                      style={{ color: 'rgba(255, 255, 255, 0.3)', fontFamily: 'MessinaSB', fontSize: '0.9em'}}
                    >
                      {wAddress}
                    </span>
                  </Typography>
                <WrapperActionsModal>
                    <Button
                        onClick={()=>{submitMe()}}
                        color='primary'
                        variant="contained"
                        tooltip={loading ? "Your delegation is still pending. Please wait for confirmation." : "Click here to delegate BOBA voting power from one L2 address to another L2 address"}
                        loading={loading}
                        triggerTime={new Date()}
                        fullWidth={isMobile}
                        size="large"
                    >
                        Delegate to me
                    </Button>
                </WrapperActionsModal>
            </Box>
            <Box style={{border: '1px solid #5E6170', padding: '10px', margin: '10px', borderRadius: '4px', background: theme.palette.background.secondary}}>
                <Typography variant="h3" sx={{mb: 1}}>
                    Or, delegate my BOBA votes to someone else
                </Typography>
                <Box sx={{display: 'flex', flexDirection: 'column'}}>
                    <Input
                        label='Delegate to:'
                        placeholder='Address (0x...)'
                        value={recipient}
                        onChange={i => setRecipient(i.target.value)}
                    />
                </Box>
                <WrapperActionsModal>
                    <Button
                        onClick={()=>{submit()}}
                        color='primary'
                        variant="contained"
                        tooltip={loading ? "Your delegation is still pending. Please wait for confirmation." : "Click here to delegate BOBA voting power from one L2 address to another L2 address"}
                        loading={loading}
                        disabled={disabled}
                        triggerTime={new Date()}
                        fullWidth={isMobile}
                        size="large"
                    >
                        Delegate to other
                    </Button>
                </WrapperActionsModal>
            </Box>
            <WrapperActionsModal>
                <Button
                    onClick={handleClose}
                    color='neutral'
                    size="large"
                >
                    Cancel
                </Button>
                </WrapperActionsModal>
        </Modal>
    )
}

export default React.memo(DelegateDaoModal)
