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
import { Box, Typography, useMediaQuery } from '@material-ui/core'

import { useDispatch } from 'react-redux'

import { closeModal, openAlert } from 'actions/uiAction'

import Modal from 'components/modal/Modal'
import Button from 'components/button/Button'
import Input from 'components/input/Input'
import Select from 'react-select'

import { useTheme } from '@emotion/react'
import { WrapperActionsModal } from 'components/modal/Modal.styles'

import { createDaoProposal } from 'actions/daoAction'

function NewProposalModal({ open }) {
    const dispatch = useDispatch()

    const [action, setAction] = useState('')
    const [votingThreshold, setVotingThreshold] = useState('')
    const [LPfee, setLPfee] = useState('')

    const [proposeText, setProposeText] = useState('')
    const [proposalUri, setProposalUri] = useState('')

    const loading = false //ToDo useSelector(selectLoading([ 'PROPOSAL_DAO/CREATE' ]))

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    const onActionChange = (e) => {
        setVotingThreshold('')
        setLPfee('')
        setProposeText('')
        setProposalUri('')
        setAction(e.value)
    }

    function handleClose() {
        setVotingThreshold('')
        setLPfee('')
        setAction('')
        setProposeText('')
        setProposalUri('')
        dispatch(closeModal('newProposalModal'))
    }

    const options = [
      { value: 'change-threshold', label: 'Change Voting Threshold' },
      { value: 'text-proposal', label: 'Freeform Text Proposal' },
      { value: 'change-lp-fee', label: 'Change LP fees' }
    ]

    const customStyles = {
      option: (provided, state) => ({
        ...provided,
        color: state.isSelected ? '#282828' : '#909090',
      }),
    }

    const submit = async () => {
        
        let res = null

        if (action === 'change-threshold') {
            res = await dispatch(createDaoProposal({
              action, //e.g. === 'change-threshold'
              value: votingThreshold, //parameter
              text: '' //text if any
            }))
        } else if (action === 'text-proposal') {
            res = await dispatch(createDaoProposal({
              action,
              value: 0,
              text: `${proposeText}@@${proposalUri}`
            }))
        } else if (action === 'change-lp-fee') {
            res = await dispatch(createDaoProposal({
              action,
              value: LPfee,
              text: ''
            }))
        }
        
        if (res) {
            dispatch(openAlert(`Proposal has been submitted. It will be listed soon`))
        }
        handleClose()
    }

    const disabled = () => {
        if (action === 'change-threshold') {
            return !votingThreshold
        } else if (action === 'text-proposal') {
            return !proposeText
        } else if (action === 'change-lp-fee') {
            if (LPfee < 0 || LPfee > 50) {
                setLPfee(0)
                return true //aka disabled
            }
            return !LPfee
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
                New Proposal
            </Typography>
            <Box sx={{display: 'flex', flexDirection: 'column'}}>
                    <Select
                        options={options}
                        onChange={onActionChange}
                        styles={customStyles}
                    >
                    </Select>
                    {action === '' && 
                        <Typography variant="body2" 
                            style={{lineHeight: '1', fontSize: '0.8em', padding: 10, paddingTop: 20, color: '#f8e5e5'}}
                        >Right now, the DAO can do three things - change the voting threshold, propose free-form text proposals, and 
                        propose changes to the bridghe 
                        </Typography>
                    }
                    {action === 'change-threshold' && 
                        <Input
                            placeholder='Enter new voting threshold...'
                            value={votingThreshold}
                            type="number"
                            onChange={(i)=>setVotingThreshold(i.target.value)}
                            fullWidth
                            sx={{marginTop: '20px'}} 
                        />
                    }
                    {action === 'change-lp-fee' && <> 
                        <Input
                            placeholder="Enter new LP fee in integer tenths"
                            value={LPfee}
                            type="number"
                            onChange={(i)=>setLPfee(i.target.value)}
                            fullWidth
                            sx={{marginTop: '20px'}} 
                        />
                        <Typography variant="body2" 
                            style={{lineHeight: '1', fontSize: '0.8em', padding: 10, paddingTop: 20, color: '#f8e5e5'}}
                        >The fee units are integer tenths. 
                        For example, proposing a fee of '3' corresponds to 
                        a bridge fee of 0.3%, whereas a fee of '25' denotes a bridge fee of 2.5%. Possible settings range from 
                        0 to 50, i.e., 0.0% to 5.0%.</Typography>
                    </>
                    }
                    {action === 'text-proposal' && <>
                        <Input
                            placeholder="Enter proposal text"
                            value={proposeText}
                            onChange={(i)=>setProposeText(i.target.value)}
                            sx={{marginTop: '20px'}} 
                        />
                        <Input
                            placeholder="Enter proposal URI (Optional)"
                            value={proposalUri}
                            onChange={(i)=>setProposalUri(i.target.value)}
                            sx={{marginTop: '20px'}} 
                        />
                    </>
                    }
            </Box>
        </Box>
            <WrapperActionsModal>
                <Button
                    onClick={handleClose}
                    color='neutral'
                    size='large'
                >
                    Cancel
                </Button>
                <Button
                    onClick={()=>{submit()}}
                    color='primary'
                    variant='contained'
                    tooltip={loading ? "Your transaction is still pending. Please wait for confirmation." : "Click here to submit a new proposal"}
                    loading={loading}
                    disabled={disabled()}
                    fullWidth={isMobile}
                    size="large"
                >
                    Propose
                </Button>
            </WrapperActionsModal>
        </Modal >
    )
}

export default React.memo(NewProposalModal)
