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

import React, { useState } from 'react'
import { Box } from '@mui/material'

import { useDispatch, useSelector } from 'react-redux'

import { closeModal, openAlert } from 'actions/uiAction'
import { castProposalVote } from 'actions/daoAction'

import { selectLoading } from 'selectors'

import Modal from 'components/modal/Modal'
import { Dropdown } from 'components/global/dropdown'
import { Button } from 'components/global/button'

const CastVoteModal = ({ open, proposalId }) => {

  const dispatch = useDispatch()
  const [ selectedVoteType, setselectedVoteType ] = useState(null)
  const loading = useSelector(selectLoading([ 'PROPOSAL/CAST/VOTE' ]))

  const onVoteTypeChange = (voteType) => {
    setselectedVoteType(voteType)
  }

  const handleClose = () => {
    dispatch(closeModal('castVoteModal'))
  }

  const options = [
    { value: 0, label: 'Vote Against' },
    { value: 1, label: 'Vote For' },
    { value: 2, label: 'Vote Abstain' }
  ]

  const submit = async () => {
    const res = await dispatch(
      castProposalVote({
        id: Number(proposalId),
        userVote: selectedVoteType.value
      })
    );

    if (res) {
      dispatch(openAlert(`Your vote has been submitted successfully.`))
    }
    handleClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      title={`Cast Vote on proposal ${proposalId}`}
    >
      <Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Dropdown
            style={{ zIndex: 2 }}
            onItemSelected={(option)=> onVoteTypeChange(option)}
            defaultItem={{
                value: null,
                label: 'Select a Vote type',
            }}
            items={options}
          />

        </Box>
      </Box>
      <Button
        onClick={() => { submit() }}
        loading={loading}
        disabled={!selectedVoteType}
        label="Submit"
      />
    </Modal >
  )
}

export default React.memo(CastVoteModal)
