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

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

import { Box, Typography} from '@mui/material'

import { closeModal, openAlert } from 'actions/uiAction'

import Modal from 'components/modal/Modal'
import Input from 'components/input/Input'
import Button from 'components/button/Button'

import { delegateVotes } from 'actions/daoAction'

import networkService from 'services/networkService'
import BobaGlassIcon from 'components/icons/BobaGlassIcon'

import * as S from './daoModal.styles'

function DelegateDaoModal({ open }) {

    const [recipient, setRecipient] = useState('');
    const dispatch = useDispatch()

    const disabled = !recipient;

    const loading = false //ToDo useSelector(selectLoading([ 'DELEGATE_DAO/CREATE' ]))

    const wAddress = networkService.account ? networkService.account : ''

    function handleClose() {
        setRecipient('')
        dispatch(closeModal('delegateDaoModal'))
    }

    const submit = async () => {
        let res = await dispatch(delegateVotes({ recipient }));
        if (res) dispatch(openAlert(`Votes delegated successfully!`))
        handleClose()
    }

    const submitMe = async () => {
        let res = await dispatch(delegateVotes({ recipient: wAddress }))
        if (res) dispatch(openAlert(`Vote self-delegation successfull!`))
        handleClose()
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            maxWidth="sm"
        >
            <Box sx={{mb: 2}}>
            <Box sx={{mb: 2,display: 'flex', alignItems: 'center'}}>
                <BobaGlassIcon />
                <Typography variant="body1" >
                    Delegate my BOBA votes
                </Typography>
            </Box>
            <S.DividerLine />
            </Box>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                <Typography variant="h3" sx={{mb: 1}}>
                    To me
                </Typography>
                <Typography variant="body3" component="p"
                    style={{ opacity: 0.65}}>
                    My address:
                </Typography>
                <Typography variant="body3" component="p"
                      style={{fontSize: '13px', mb:2}}
                    >
                      {wAddress}
                </Typography>
                <Button
                    sx={{mb: 2}}
                    onClick={()=>{submitMe()}}
                    color='primary'
                    variant="outlined"
                    tooltip={loading ? "Your delegation is still pending. Please wait for confirmation." : "Click here to delegate BOBA voting power to yourself"}
                    loading={loading}
                    triggerTime={new Date()}
                    fullWidth={true}
                    size="large"
                >
                    Delegate to me
                </Button>
            </Box>
            <Box sx={{
                display: 'flex', justifyContent: 'space-around',
                overflow: 'hidden',
                gap: '10px',
                alignItems: 'center'
            }}>
                <S.DividerLine />
                <Typography variant="body3" >OR</Typography>
                <S.DividerLine />
            </Box>
            <Box
                sx={{
                    gap: '10px',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Typography variant="h3" sx={{mb: 1}}>
                    To someone else
                </Typography>
                <Box sx={{display: 'flex', mb: 1, flexDirection: 'column'}}>
                    <Input
                        label='Receiving address:'
                        placeholder='Address (0x...)'
                        value={recipient}
                        onChange={i => setRecipient(i.target.value)}
                    />
                </Box>
                <Button
                    onClick={()=>{submit()}}
                    color='primary'
                    variant="outlined"
                    tooltip={loading ? "Your delegation is still pending. Please wait for confirmation." : "Click here to delegate BOBA voting power from one L2 address to another L2 address"}
                    loading={loading}
                    disabled={disabled}
                    triggerTime={new Date()}
                    fullWidth={true}
                    size="large"
                >
                    Delegate to other
                </Button>
            </Box>
        </Modal>
    )
}

export default React.memo(DelegateDaoModal)
