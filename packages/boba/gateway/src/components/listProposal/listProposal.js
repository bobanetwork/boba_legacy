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

import { Circle } from '@mui/icons-material'
import { Box, Link, Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { executeProposal, queueProposal } from 'actions/daoAction'
import { openAlert, openModal } from 'actions/uiAction'
import Button from 'components/button/Button'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import * as S from './listProposal.styles'
import { formatDate } from 'util/dates'
import { Label } from 'components/dao/label'
import { Svg } from 'components/global/svg'
import Arrow from 'assets/images/icons/arrowdown.svg';

import { LinearProgress } from 'components/dao/LinearProgress'

const useStyles = makeStyles({
  colorPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  barColorPrimary: {
    backgroundColor: '#83BF6E',
  },
});

const ListProposal = ({ proposal }) => {
  const dispatch = useDispatch()
  const classes = useStyles()
  const [isOpen, setIsOpen] = useState(false);
  const [votePercent, setVotePercent] = useState(0)
  useEffect(() => {
    const init = async () => {
      if (proposal.totalVotes > 0) {
        setVotePercent(
          Math.round((100 * proposal.forVotes) / proposal.totalVotes)
        )
      } else {
        setVotePercent(0)
      }
    };
    init()
  }, [proposal])

  const onVote = (id) => {
    dispatch(openModal('castVoteModal', null, null, null, null, id))
  }

  const doQueueProposal = async () => {
    const res = await dispatch(queueProposal(proposal.id))
    if (res) {
      dispatch(openAlert(`Proposal is queuing`))
    }
  }

  const doExecuteProposal = async () => {
    const res = await dispatch(executeProposal(proposal.id))
    if (res) {
      dispatch(openAlert(`Proposal is executing`))
    }
  }
  const getDescription = ({ description }) => {
    const hasLink = !!description?.includes('@@');
    const text = hasLink ? description?.split('@@')[0] : description;
    return text;
  }

  const getLink = ({ description }) => {
    const hasLink = !!description?.includes('@@');
    const link = hasLink ? description?.split('@@')[1] : null;
    return link;
  };

  const FormatDescription = ({ description }) => {
    return (
      <Typography variant="body2">{getDescription({ description })}</Typography>
    )
  };

  const startTime = formatDate(proposal.startTimestamp, 'lll')
  const endTime = formatDate(proposal.endTimestamp, 'lll')

  const hasVoted = proposal.hasVoted

  const buttonConfig = {
    Active: {
      label: 'Vote',
      onClick: () => onVote(proposal.id)
    },
    Queued: {
      label: 'EXECUTE',
      onClick: doExecuteProposal
    },
    Succeeded: {
      label: 'QUEUE',
      onClick: doQueueProposal
    }
  };

  const proposalState = proposal.state;
  const config = buttonConfig[proposalState];

  return (
    <S.Wrapper onClick={()=> setIsOpen(!isOpen)}>
      <S.GridContainer
        container
        spacing={1}
        direction="row"
        justifyContent="flex-start"
        alignItems="center"
      >
        <S.GridItemTag item xs={12} md={12}>
          <S.ItemHeaderContainer>
            <Typography
              variant="body2"
              component="span"
              style={{
                fontWeight: '700',
                marginLeft: '0px',
                marginRight: '10px',
              }}
            >
              #{proposal.id}
            </Typography>
            <FormatDescription description={proposal.description} />
            <Label status={proposal?.state} />
            <Box
              sx={{
                marginLeft: '10px',
                transform: `rotate(${isOpen ? '180deg' : '0deg'})`,
              }}
            >
              <Svg src={Arrow} fill="#fff"/>
            </Box>
          </S.ItemHeaderContainer>
        </S.GridItemTag>
        <Box
          sx={{
            width: '100%',
            alignItems: 'flex-start',
            flexDirection:'column',
            my: '10px',
            display: isOpen ? 'flex' : 'none',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" alignItems="center">
              <Typography variant="body4" sx={{ opacity: 0.65, ml: '8px' }}>
                {`${startTime} - ${endTime}`}
              </Typography >
            </Box>
          </Box>
          {proposal.totalVotes > 0 &&
            <S.GridItemTagR sx={{ width: '100%', padding: '15px 0px' }}>
              <Box
                sx={{
                  marginTop: '8px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
              }}>
                <Typography variant="body4">
                  Total: {proposal.totalVotes}
                </Typography>
              </Box>
              <Box sx={{ width: '100%', margin: '8px 0px' }}>
                <LinearProgress
                  style={{
                    width: '100%'
                  }}
                  A={proposal.forVotes}
                  B={proposal.againstVotes}
                  C={proposal.abstainVotes}
                />
              </Box>
            </S.GridItemTagR>
          }
          <S.GridItemTag item xs={12} md={12}>
            {config && (!hasVoted || proposalState !== 'Active') && (
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  gap: '20px',
                  padding: '15px 0px',
                }}
              >
                <Button
                  type="primary"
                  variant="outlined"
                  onClick={config.onClick}
                >
                  {config.label}
                </Button>
              </Box>
            )}
            {getLink({ description: proposal.description }) && (
              <Link
                color="inherit"
                variant="body2"
                target="_blank"
                rel="noopener noreferrer"
                href={getLink({ description: proposal.description })}
                ml='8px'
              >
                More details
              </Link>
            )}
          </S.GridItemTag>
        </Box>

      </S.GridContainer>
    </S.Wrapper>
    )
}


export default React.memo(ListProposal)
