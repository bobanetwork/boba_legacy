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

import { Box, Typography } from '@mui/material'
import CheckMarkIcon from '@mui/icons-material/CheckCircleOutline'

import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import Button from 'components/button/Button'

import { openAlert } from 'actions/uiAction'
import { setConnectBOBA } from 'actions/setupAction'
import { fetchLockRecords, fetchPools, onDistributePool, onSavePoolVote } from 'actions/veBobaAction'

import { selectAccountEnabled } from 'selectors/setupSelector'
import { selectLockRecords } from 'selectors/veBobaSelector'

import BobaNFTGlass from 'images/boba2/BobaNFTGlass.svg'

import * as G from 'containers/Global.styles'
import * as S from './Vote.style'

import PoolList from './Pools/poolList'

const responsive = {
  superLargeDesktop: {
    // the naming can be any, depends on you.
    breakpoint: { max: 4000, min: 3000 },
    items: 5
  },
  desktop: {
    breakpoint: { max: 3000, min: 1024 },
    items: 5
  },
  tablet: {
    breakpoint: { max: 1024, min: 464 },
    items: 4
  },
  mobile: {
    breakpoint: { max: 464, min: 0 },
    items: 2
  }
};

function Vote() {
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

  async function connectToBOBA() {
    dispatch(setConnectBOBA(true))
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


  return < S.VotePageContainer >
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="body2" style={{ opacity: '0.5' }}>Please select a govBoba to vote</Typography>
      {
        !nftRecords.length ? <S.Card p={4}>
          <Typography variant="body2" style={{ opacity: '0.5' }}>Oh! You don't have veBoba NFT, Please go to Lock to get them.</Typography>
        </S.Card> :
          <Carousel
            showDots={false}
            responsive={responsive}
            keyBoardControl={true}
            customTransition="all .5"
          >
            {nftRecords.map((nft) => {
              return <S.NftContainer
                key={nft.tokenId}
                m={1}
                p={1}
                active={nft.tokenId === selectedNft?.tokenId}
                onClick={() => { setSelectedNft(nft) }}
              >
                {nft.tokenId === selectedNft?.tokenId ?
                  <CheckMarkIcon fontSize='small' color="warning"
                    sx={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px'
                    }}
                  /> : null}
                <G.ThumbnailContainer p={1} m={1}>
                  <img src={BobaNFTGlass} alt={nft.tokenId} width='100%' height='100%' />
                </G.ThumbnailContainer>
                <Box display="flex" flexDirection="column">
                  <Typography variant="body1">#{nft.tokenId}</Typography>
                  <Typography variant="body2">{nft.balance.toFixed(2)} <Typography component="span" variant="body3" sx={{ opacity: 0.5 }}>veBoba</Typography> </Typography>
                </Box>
              </S.NftContainer>
            })}
          </Carousel>}
    </Box>

    <S.VoteContent gap={2}>
      <Typography variant="h3">Proposals</Typography>
      <S.VoteContentAction>
        {
          !accountEnabled ?
            <Button
              fullWidth={true}
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => connectToBOBA()}
            >
              Connect to BOBA
            </Button> : <Box display="flex" gap={2} alignItems="center">
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
      </S.VoteContentAction>
      <PoolList
        token={selectedNft}
        onPoolVoteChange={onPoolVoteChange}
        onDistribute={onDistribute}
      />
    </S.VoteContent>
  </S.VotePageContainer >
}

export default React.memo(Vote)
