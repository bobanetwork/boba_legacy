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

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Box, styled, Typography } from '@mui/material'

import Button from 'components/button/Button'

import { openAlert } from 'actions/uiAction'

import {
  fetchLockRecords,
  fetchPools,
  onDistributePool,
  onSavePoolVote
} from 'actions/veBobaAction'

import { selectAccountEnabled } from 'selectors/setupSelector'
import { selectLockRecords } from 'selectors/veBobaSelector'

import { ContentEmpty } from 'containers/Global.styles'

import PoolList from './Pools/poolList'
import VeNftsList from './VeNfts/VeNfts.list';


// styled component
const Action = styled(Box)({
  display: 'flex',
  width: '100%',
  justifyContent: 'flex-end'
});



function Vote({
  connectToBOBA
}) {
  const dispatch = useDispatch()

  const nftRecords = useSelector(selectLockRecords);
  const accountEnabled = useSelector(selectAccountEnabled())

  const [ selectedNft, setSelectedNft ] = useState(null);
  const [ poolsVote, setPoolsVote ] = useState(null);
  const [ usedVotingPower, setUsedVotingPower ] = useState(0);

  const onPoolVoteChange = (poolId, value) => {
    setPoolsVote({
      ...poolsVote,
      [ poolId ]: value
    })
  }

  const onVote = async () => {
    const res = await dispatch(onSavePoolVote({
      tokenId: selectedNft.tokenId,
      pools: Object.keys(poolsVote),
      weights: Object.values(poolsVote),
    }))
    if (res) {
      dispatch(fetchLockRecords());
      dispatch(fetchPools());
      dispatch(
        openAlert(`Vote has been submitted successfully!`)
      )
    }
  }

  const onDistribute = async (gaugeAddress) => {
    const res = await dispatch(onDistributePool({
      gaugeAddress
    }))

    if (res) {
      dispatch(fetchPools());
      dispatch(
        openAlert(`Pool has been distributed successfully!`)
      )
    }
  }

  useEffect(() => {
    if (selectedNft) {
      let usedPower = (selectedNft.usedWeights / selectedNft.balance) * 100
      setUsedVotingPower(parseInt(usedPower))
    }
  }, [ selectedNft ]);

  useEffect(() => {
    if (!!accountEnabled) {
      dispatch(fetchLockRecords());
      dispatch(fetchPools());
    }
  }, [ accountEnabled, dispatch ]);


  return <>
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="body2" style={{ opacity: '0.5' }}>Please select a govBoba to vote</Typography>
      {
        !nftRecords.length
          ? <ContentEmpty p={4} minHeight="auto">
            <Typography variant="body2" style={{ opacity: '0.5' }}>Oh! You don't have veBoba NFT, Please go to Lock to get them.</Typography>
          </ContentEmpty>
          : <VeNftsList
            nftRecords={nftRecords}
            onSelectNft={setSelectedNft}
            selectedNft={selectedNft}
          />
      }
    </Box>
    <Action>
      {!accountEnabled
        ?
        <Button
          fullWidth={true}
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => connectToBOBA()}
        >
          Connect to BOBA
        </Button>
        : <Box display="flex" gap={2} alignItems="center">
          {selectedNft && <Typography variant="body2">Selected #{selectedNft.tokenId}, Voting power used {usedVotingPower} %</Typography>}
          <Button
            fullWidth={true}
            variant="outlined"
            color="primary"
            size="medium"
            onClick={onVote}
            disabled={!selectedNft || !poolsVote}
          >
            Submit Vote
          </Button>
        </Box>
      }
    </Action>
    <PoolList
      token={selectedNft}
      onPoolVoteChange={onPoolVoteChange}
      onDistribute={onDistribute}
    />
  </>
}

export default React.memo(Vote)
