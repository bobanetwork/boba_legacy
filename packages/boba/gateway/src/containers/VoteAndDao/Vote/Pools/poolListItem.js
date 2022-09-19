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
import { Box, Typography, Slider, styled } from '@mui/material'

import Button from 'components/button/Button'
import bobaLogo from 'images/boba-token.svg'

import * as G from 'containers/Global.styles'

// styled component
const ListItemContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  width: '100%',
  padding: '10px',
  borderBottom: theme.palette.primary.borderBottom
}))


function PoolListItem({
  pool,
  onPoolVoteChange,
  token,
  onDistribute,
}) {

  const [ selectedVote, setSelectedVote ] = useState(0);
  const [ myVote, setMyVote ] = useState({});

  const handleVoteChange = (e, value) => {
    setSelectedVote(value);
    onPoolVoteChange(pool.poolId, value);
  }

  useEffect(() => {
    if (token) {
      let tokenUsed = pool.usedTokens.find((t) => t.tokenId === token.tokenId);
      if (tokenUsed) {
        let tokenBalance = parseInt(token.balance);
        let poolVote = Number(tokenUsed.vote);
        let votePercent = parseInt((poolVote / tokenBalance) * 100);
        setMyVote({
          value: poolVote.toFixed(2),
          votePercent,
        })
        setSelectedVote(votePercent)
      } else {
        setSelectedVote(0)
        setMyVote({})
      }
    }

  }, [ token, pool ]);

  return <ListItemContent>
    <G.TableBody>
      <G.TableCell width="20%" pl={1} py={2}>
        <img src={bobaLogo} alt="boba logo" width={25} height={25} />
        <Box display="flex" flexDirection="column">
          <Typography variant="body2">
            {pool.name}
          </Typography>
          <Typography variant="body4" sx={{ opacity: 0.65 }}>
            {pool.description}
          </Typography>
        </Box>
      </G.TableCell>
      <G.TableCell width="20%" pl={1} py={2}>
        <Box display="flex" flexDirection="column" alignItems="flex-start">
          <Typography variant="body2">
            {pool.totalVotes}
          </Typography>
          <Typography variant="body4" sx={{ opacity: 0.65 }}>
            {pool.votePercentage.toFixed(2)}%
          </Typography>
        </Box>
      </G.TableCell>
      <G.TableCell width="20%" pl={1} py={2}>
        <Box display="flex" flexDirection="column" alignItems="flex-start">
          <Typography variant="body2">
            {myVote.value || 0}
          </Typography>
          <Typography variant="body4" sx={{ opacity: 0.65 }}>
            {myVote.votePercent || 0}%
          </Typography>
        </Box>
      </G.TableCell>
      <G.TableCell pl={1} py={2} width="30%" flex="2">
        <Box display="flex" width="100%" alignItems="center" justifyContent="space-around" gap={2} px={1}>
          <Typography variant="body2">
            {selectedVote}%
          </Typography>
          <Slider
            defaultValue={0}
            valueLabelDisplay="auto"
            step={1}
            min={0}
            max={100}
            value={selectedVote}
            marks={[
              {
                value: 0,
                label: '0'
              },
              {
                value: 100,
                label: '100'
              }
            ]}
            onChange={handleVoteChange}
          />
        </Box>
      </G.TableCell>
      <G.TableCell width="10%" pl={1} py={2}>
        <Box display="flex" flexDirection="column" alignItems="flex-start">
          <Button
            fullWidth={true}
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => onDistribute(pool.gaugeAddress)}
          >
            Destribute
          </Button>
        </Box>
      </G.TableCell>
    </G.TableBody>
  </ListItemContent>
}

export default PoolListItem;
