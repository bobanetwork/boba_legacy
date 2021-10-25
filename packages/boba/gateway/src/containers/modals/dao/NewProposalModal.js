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
import { Typography } from '@material-ui/core'

import { useDispatch } from 'react-redux'

import { closeModal, openAlert, openError } from 'actions/uiAction'

import * as styles from './daoModal.module.scss'

import Modal from 'components/modal/Modal'
import Button from 'components/button/Button'
import Input from 'components/input/Input'

import Select from 'react-select'

import { WrapperActionsModal } from 'components/modal/Modal.styles'
import { createDaoProposal } from 'actions/daoAction'

function NewProposalModal({ open }) {
    const dispatch = useDispatch()

    const [action, setAction] = useState('')
    const [votingThreshold, setVotingThreshold] = useState('')
    const [LPfee, setLPfee] = useState('')

    const [proposeText, setProposeText] = useState('')
    const [proposalUri, setProposalUri] = useState('')

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

    const disabledProposal = () => {
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
            <Typography variant="h2">New Proposal</Typography>
            <div className={styles.modalContent}>
                <div className={styles.proposalAction}>
                    <Select
                        options={options}
                        onChange={onActionChange}
                        styles={customStyles}
                    >
                    </Select>
                    {action === 'change-threshold' && 
                        <Input
                            label="Voting Threshold"
                            value={votingThreshold}
                            type="number"
                            onChange={(i)=>setVotingThreshold(i.target.value)}
                            variant="standard"
                            newStyle
                        />
                    }
                    {action === 'change-lp-fee' && <> 
                        <Input
                            label="LP fee in integer tenths"
                            value={LPfee}
                            type="number"
                            onChange={(i)=>setLPfee(i.target.value)}
                            variant="standard"
                            newStyle
                        />
                        <Typography variant="body2" style={{lineHeight: '1', paddingTop: 10, fontSize: '0.7em'}}>The fee units are integer tenths. For example, proposing a fee of '3' corresponds to 
                        an LB bridge fee of 0.3%, whereas a fee of '25' denotes an LP bridge fee of 2.5%. Possible settings range from 
                        0 to 50, i.e., 0.0% to 5.0%.</Typography>
                    </>
                    }
                    {action === 'text-proposal' && <>
                        <Input
                            label="Enter proposal text"
                            value={proposeText}
                            onChange={(i)=>setProposeText(i.target.value)}
                            variant="standard"
                            newStyle
                        />
                        <Input
                            label="Enter proposal URI (Optional)"
                            value={proposalUri}
                            onChange={(i)=>setProposalUri(i.target.value)}
                            variant="standard"
                            newStyle
                        />
                    </>
                    }
                </div>
            </div>

            <WrapperActionsModal>
                <Button
                    onClick={handleClose}
                    color='neutral'
                    size="large"
                >
                    Cancel
                </Button>

                <Button
                    onClick={() => { submit({ useLedgerSign: false }) }}
                    color='primary'
                    size="large"
                    variant="contained"
                    // loading={loading} // TODO: Implement loading base on the action trigger
                    disabled={disabledProposal()}
                >
                    Propose
                </Button>
            </WrapperActionsModal>
        </Modal >
    )
}

export default React.memo(NewProposalModal)
