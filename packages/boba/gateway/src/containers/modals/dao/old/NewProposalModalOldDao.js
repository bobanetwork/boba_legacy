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

import React, { useState } from 'react';
import { Box, Button, Dropdown, Input, Modal, ModalTypography } from 'components/global';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, openAlert } from 'actions/uiAction';
import { createDaoProposal } from 'actions/daoAction';
import { selectProposalThreshold } from 'selectors';

const NewProposalModal = ({ open }) => {
  const dispatch = useDispatch();

  const initialFormState = {
    action: '',
    votingThreshold: '',
    LPfeeMin: '',
    LPfeeMax: '',
    LPfeeOwn: '',
    proposeText: '',
    proposalUri: ''
  };

  const [formState, setFormState] = useState(initialFormState);

  const {
    action,
    votingThreshold,
    LPfeeMin,
    LPfeeMax,
    LPfeeOwn,
    proposeText,
    proposalUri,
  } = formState

  const resetState = () => setFormState(initialFormState);

  const onActionChange = (option) => {
    resetState();
    setFormState(prevState => ({ ...prevState, action: option.value }));
  };

  const handleClose = () => {
    resetState();
    dispatch(closeModal('newProposalModal'));
  };

  const handleCreateDaoProposal = async (action, value = [], text = '') => {
    const result = await dispatch(createDaoProposal({ action, value, text }));
    if (result) {
      dispatch(openAlert('Proposal has been submitted. It will be listed soon'));
      handleClose();
    }
  };

  const submit = async () => {
    switch (action) {
      case 'change-threshold':
        handleCreateDaoProposal(action, [votingThreshold]);
        break;
      case 'text-proposal':
        handleCreateDaoProposal(action, [], `${proposeText}@@${proposalUri}`);
        break;
      case 'change-lp1-fee':
      case 'change-lp2-fee':
        handleCreateDaoProposal(action, [
          Math.round(Number(LPfeeMin) * 10),
          Math.round(Number(LPfeeMax) * 10),
          Math.round(Number(LPfeeOwn) * 10)
        ]);
        break;
      default:
        break;
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      title="Create Proposal"
    >
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
        onClick={() => {
          submit()
        }}
        /*tooltip={loading ? "Your transaction is still pending. Please wait for confirmation." : "Click here to submit a new proposal"}*/
        loading={loading}
        disabled={disabled()}
        label="Create"
      />
    </Modal >
  )
}

export default React.memo(NewProposalModal)
