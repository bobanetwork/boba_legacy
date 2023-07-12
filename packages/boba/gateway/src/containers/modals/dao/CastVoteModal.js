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

import React, { useState, useEffect } from 'react'
import { Box, Typography } from '@mui/material'

import { useDispatch, useSelector } from 'react-redux'

import { closeModal, openAlert } from 'actions/uiAction'

import Modal from 'components/modal/Modal'


import { castProposalVote } from 'actions/daoAction'
import BobaGlassIcon from 'components/icons/BobaGlassIcon'
import { selectLockRecords,selectLoading } from 'selectors'
import BobaNFTGlass from 'images/boba2/BobaNFTGlass.svg'

import networkService from 'services/networkService'
import { Dropdown } from 'components/global/dropdown'
import { Button } from 'components/global/button'

const CastVoteModal = ({ open, proposalId }) => {

  const dispatch = useDispatch()
  const [ selectedVoteType, setselectedVoteType ] = useState(null)
  const [ tokens, setTokens ] = useState([])
  const [ nftOptions, setNftOptions ] = useState([]);
  const [ filterOptions, setFilterOptions ] = useState([]);
  const [ loadingOptions, setloadingOptions ] = useState([]);

  const loading = useSelector(selectLoading([ 'PROPOSAL/CAST/VOTE' ]))

  const records = useSelector(selectLockRecords);

  useEffect(() => {
    if (records && records.length > 0) {
      const options = records.map((token) => ({
        value: token.tokenId,
        balance: token.balance,
        label: `#${token.tokenId}`,
        title: `VeBoba - ${token.balance}`,
        subTitle: `Lock Amount - ${token.lockedAmount}`,
        icon: BobaNFTGlass
      }))
      setNftOptions(options);
    }

    return () => {
      setNftOptions([]);
    };
  }, [ records ]);


  useEffect(() => {
    const filterUsedTokens = async () =>{
      setloadingOptions(true);
      const filterOptionP = nftOptions
        .map(async (token) => {
          const receipt = await networkService.checkProposalVote(
            proposalId,
            token.value
          )
          if (!receipt || !receipt.hasVoted) {
            return token
          }
      }).filter(Boolean)

      const tokensRes = await Promise.all(filterOptionP);
      const filterTokens = tokensRes.filter(Boolean)
      setloadingOptions(false);
      setFilterOptions(filterTokens);
    }

    filterUsedTokens();
  }, [nftOptions, proposalId]);

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

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? '#282828' : '#909090',
    }),
  }

  const submit = async () => {
    const tokenIds = tokens.map((t) => t.value);

    const res = await dispatch(
      castProposalVote({
        id: Number(proposalId),
        userVote: selectedVoteType.value,
        tokenIds
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

          <Dropdown
            style={{ zIndex: 1 }}
            onItemSelected={(option)=> setTokens(option)}
            defaultItem={{
                value: null,
                label: 'Select Nft token',
            }}
            items={filterOptions}
          />

        </Box>
      </Box>
      <Button
        onClick={() => { submit() }}
        loading={loading}
        disabled={!tokens.length || !selectedVoteType}
        label="Submit"
        /*
        tooltip={loading ? "Your transaction is still pending. Please wait for confirmation." : "Click here to cast on a proposal"}
        */
      />
    </Modal >
  )
}

export default React.memo(CastVoteModal)
