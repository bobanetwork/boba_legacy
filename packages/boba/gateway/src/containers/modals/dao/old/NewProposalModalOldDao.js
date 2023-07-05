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
import Modal from 'components/modal/Modal'
import Input from 'components/input/Input'
// import Select from 'react-select'
import Select from 'components/select/Select'

//import { Input } from 'components/global/Input'
import { createDaoProposal } from 'actions/daoAction'
import { selectProposalThreshold } from 'selectors'
import { Button } from 'components/global/button'
import { ModalTypography } from 'components/global/modalTypography'
import { Dropdown } from 'components/global/dropdown'
import { Line } from './style'

const NewProposalModal = ({ open }) => {

  const dispatch = useDispatch()

  const [action, setAction] = useState('')
  const [votingThreshold, setVotingThreshold] = useState('')

  const [LPfeeMin, setLPfeeMin] = useState('')
  const [LPfeeMax, setLPfeeMax] = useState('')
  const [LPfeeOwn, setLPfeeOwn] = useState('')

  const [proposeText, setProposeText] = useState('')
  const [proposalUri, setProposalUri] = useState('')

  const loading = false //ToDo useSelector(selectLoading([ 'PROPOSAL_DAO/CREATE' ]))


  const proposalThreshold = useSelector(selectProposalThreshold)

  const onActionChange = (option) => {
    setVotingThreshold('')
    setLPfeeMin('')
    setLPfeeMax('')
    setLPfeeOwn('')
    setProposeText('')
    setProposalUri('')
    setAction(option.value)
  }

  const handleClose = () => {
    setVotingThreshold('')
    setLPfeeMin('')
    setLPfeeMax('')
    setLPfeeOwn('')
    setAction('')
    setProposeText('')
    setProposalUri('')
    dispatch(closeModal('newProposalModal'))
  }

  const options = [
    {
      value: 'change-threshold',
      label: 'Change Voting Threshold',
      title: 'Change Voting Threshold',
    },
    {
      value: 'text-proposal',
      label: 'Freeform Text Proposal',
      title: 'Freeform Text Proposal',
    },
    {
      value: 'change-lp1-fee',
      label: 'Change L1 LP fees',
      title: 'Change L1 LP fees',
    },
    {
      value: 'change-lp2-fee',
      label: 'Change L2 LP fees',
      title: 'Change L2 LP fees',
    },
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
      res = await dispatch(
        createDaoProposal({
          action,
          value: [votingThreshold],
          text: '', //extra text if any
      }))
    } else if (action === 'text-proposal') {
      res = await dispatch(createDaoProposal({
        action,
        text: `${proposeText}@@${proposalUri}`
      }))
    } else if (action === 'change-lp1-fee' || action === 'change-lp2-fee') {
      res = await dispatch(createDaoProposal({
        action,
        value: [ Math.round(Number(LPfeeMin) * 10), Math.round(Number(LPfeeMax) * 10), Math.round(Number(LPfeeOwn) * 10) ],
        text: ''  //extra text if any
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
    } else if (action === 'change-lp1-fee' || action === 'change-lp2-fee') {
      if (Number(LPfeeMin) < 0.0 || Number(LPfeeMin) > 5.0) {
        return true //aka disabled
      }
      if (Number(LPfeeMax) < 0.0 || Number(LPfeeMax) > 5.0) {
        return true //aka disabled
      }
      if (Number(LPfeeMax) <= Number(LPfeeMin)) {
        return true //aka disabled
      }
      if (Number(LPfeeOwn) < 0.0 || Number(LPfeeOwn) > 5.0) {
        return true
      }
      if (LPfeeMin === '') {
        return true
      }
      if (LPfeeMax === '') {
        return true
      }
      if (LPfeeOwn === '') {
        return true
      }
      return false
    }
  }


  return (
    <Modal open={open} onClose={handleClose} maxWidth="sm" title="Create Proposal">
      <Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ModalTypography variant="body2" >
            At least 100000.0 BOBA + xBOBA are needed to create a new proposal
          </ModalTypography>

          <Dropdown
            style={{ zIndex: 2 }}
            onItemSelected={(option)=> onActionChange(option)}
            defaultItem={{
                value: null,
                label: 'Choose type of proposal',
            }}
            items={options}
          />
          <Line />
          {action === 'change-threshold' &&
            <>
              <ModalTypography variant="body2">
                The minimum number of votes required for an account to create a proposal. The current value is {proposalThreshold}.
              </ModalTypography>

              <Input
                  label="DAO voting threshold"
                  placeholder='New voting threshold (e.g. 65000)'
                  value={votingThreshold}
                  type="number"
                  onChange={(i) => setVotingThreshold(i.target.value)}
                  fullWidth
                  sx={{ marginBottom: '20px' }}
            />
            </>
          }
          {(action === 'change-lp1-fee' || action === 'change-lp2-fee') &&
            <>
              <ModalTypography variant="body2">
                Possible settings range from 0.0% to 5.0%. All three values must
                be specified and the maximum fee must be larger than the minimum
                fee.
              </ModalTypography>
              <Input
                label="New LP minimium fee (%)"
                placeholder="Minimium fee (e.g. 1.0)"
                value={LPfeeMin}
                type="number"
                onChange={(i) => setLPfeeMin(i.target.value)}
                fullWidth
              />
              <Input
                label="New LP maximum fee (%)"
                placeholder="Maximum fee (e.g. 3.0)"
                value={LPfeeMax}
                type="number"
                onChange={(i) => setLPfeeMax(i.target.value)}
                fullWidth
              />
              <Input
                label="New LP operator fee (%)"
                placeholder="Operator fee (e.g. 1.0)"
                value={LPfeeOwn}
                type="number"
                onChange={(i) => setLPfeeOwn(i.target.value)}
                fullWidth
              />
            </>
          }
          {action === 'text-proposal' &&
            <>
              <ModalTypography variant="body2">
                Your proposal title is limited to 100 characters. Use the link field below to provide more information.
              </ModalTypography>
              <Input
                placeholder="Title (<100 characters)"
                value={proposeText}
                onChange={(i) => setProposeText(i.target.value.slice(0, 100))}
              />
              <ModalTypography variant="body2">
                You should provide additional information (technical
                specifications, diagrams, forum threads, and other material) on
                a seperate website. The link length is limited to 150
                characters. You may need to use a link shortener.
              </ModalTypography>
              <Input
                placeholder="URI, https://..."
                value={proposalUri}
                onChange={(i) => setProposalUri(i.target.value.slice(0, 150))}
              />
            </>
          }
        </Box>
      </Box>
      <Button
        onClick={() => { submit() }}
        /*tooltip={loading ? "Your transaction is still pending. Please wait for confirmation." : "Click here to submit a new proposal"}*/
        loading={loading}
        disabled={disabled()}
        label="Create"
      />
    </Modal >
  )
}

export default React.memo(NewProposalModal)
