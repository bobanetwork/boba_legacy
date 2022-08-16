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

import Button from 'components/button/Button'

import Input from 'components/input/Input'

import { setConnectBOBA } from 'actions/setupAction'
import { fetchLockRecords, fetchPools } from 'actions/veBobaAction'

import { selectAccountEnabled } from 'selectors/setupSelector'
import { selectLockRecords } from 'selectors/veBobaSelector'

import BobaNFTGlass from 'images/boba2/BobaNFTGlass.svg'

import * as G from 'containers/Global.styles'
import * as S from './Vote.style'

import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
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

  const [ balance, setBalance ] = useState('--');
  const [ nftSearch, setNftSearch ] = useState('');
  const [ selectedNft, setSelectedNft ] = useState(null);

  async function connectToBOBA() {
    dispatch(setConnectBOBA(true))
  }

  useEffect(() => {
    if (!!accountEnabled) {
      dispatch(fetchLockRecords());
      dispatch(fetchPools());
    }
  }, [ accountEnabled, dispatch ]);

  useEffect(() => {
    if (!!accountEnabled) {
      const veBoba = nftRecords.reduce((s, record) => s + Number(record.balance), 0);
      setBalance(veBoba.toFixed(2))
    }
  }, [ accountEnabled, nftRecords ]);

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
                  <Typography variant="body2">{nft.balance} <Typography component="span" variant="body3" sx={{ opacity: 0.5 }}>veBoba</Typography> </Typography>
                </Box>
              </S.NftContainer>
            })}
          </Carousel>}
    </Box>

    <S.VoteContent gap={2}>
      <Typography variant="h3">Proposals</Typography>
      <S.VoteContentAction>
        <Box>
          <Input
            size='small'
            placeholder='Search WAGMI Pools'
            onChange={i => { setNftSearch(i.target.value) }}
          />
        </Box>
        <Box display="flex" justifySelf="flex-end">
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
                {selectedNft && <Typography variant="body2">Selected #{selectedNft.tokenId}, Voting power used {selectedNft.balance}</Typography>}
                <Button
                  fullWidth={true}
                  variant="outlined"
                  color="primary"
                  size="small"
                >
                  Vote
                </Button>
              </Box>
          }
        </Box>
      </S.VoteContentAction>
      <PoolList />
    </S.VoteContent>
  </S.VotePageContainer >
}

export default React.memo(Vote)
