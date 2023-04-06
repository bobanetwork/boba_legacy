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
import { Box, LinearProgress, Link, Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { executeProposal, queueProposal } from 'actions/daoAction'
import { openAlert, openModal } from 'actions/uiAction'
import Button from 'components/button/Button'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import * as S from "./listProposal.styles"
import {formatDate} from 'util/dates';

const useStyles = makeStyles({
    colorPrimary: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    barColorPrimary: {
        backgroundColor: '#83BF6E',
    }
});

function ListProposal({
    proposal
}) {

    const dispatch = useDispatch()
    const classes = useStyles()

    const [ votePercent, setVotePercent ] = useState(0)

    useEffect(() => {
        const init = async () => {
            if (proposal.totalVotes > 0) {
                setVotePercent(Math.round((100 * proposal.forVotes) / proposal.totalVotes))
            } else {
                setVotePercent(0)
            }
        };
        init()
    }, [ proposal ])


    const onVote = (id) => {
      dispatch(openModal('castVoteModal', null, null, null, null, id))
    }

    const doQueueProposal = async () => {
        let res = await dispatch(queueProposal(proposal.id))
        if (res) dispatch(openAlert(`Proposal is queuing`))
    }

    const doExecuteProposal = async () => {
        let res = await dispatch(executeProposal(proposal.id))
        if (res) dispatch(openAlert(`Proposal is executing`))
    }

    const FormatDescription = ({ description }) => {
        if (!!description.includes('@@')) {
            let descList = description.split('@@')
            if (descList[ 1 ] !== '') {
                //should validate http link
              return <Typography variant="body2" display="flex">&nbsp;{descList[ 0 ]}&nbsp;&nbsp;<Link
                color="inherit"
                variant="body2"
                target="_blank"
                rel="noopener noreferrer"
                href={descList[ 1 ]}
              >More details</Link></Typography>
            } else {
                return <>{descList[ 0 ]}</>
            }
        }
        return <>{description}</>;
    }

    const startTime = formatDate(proposal.startTimestamp,'lll');
    const endTime = formatDate(proposal.endTimestamp,'lll');

    let hasVoted = proposal.hasVoted

    return (
        <S.Wrapper>
            <S.GridContainer container
                spacing={1}
                direction="row"
                justifyContent="flex-start"
                alignItems="center"
            >
                <S.GridItemTag item
                    xs={12}
                    md={12}
                >
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" component="span" style={{ fontWeight: '700' }}> Proposal {proposal.id} : </Typography> <FormatDescription description={proposal.description} />
                    </Box>
                    <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', my: '10px' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography style={{ fontSize: '0.8em', opacity: '0.65', lineHeight: '1.2em' }}>
                            Voting Time
                          </Typography>
                          <Box display="flex" alignItems="center">
                            <Typography component="span" variant='body3' sx={{ opacity: 0.65, fontSize: '0.8em' }}>
                              {startTime}
                            </Typography >
                            &nbsp; - &nbsp;
                            <Typography component="span" variant='body3' sx={{ opacity: 0.65, fontSize: '0.8em' }}>
                              {endTime}
                            </Typography >
                          </Box>

                          <Typography variant="overline" style={{ fontSize: '0.8em', lineHeight: '1.2em' }}>

                          </Typography>
                        </Box>
                        <Typography variant="overline" style={{ fontSize: '0.8em', lineHeight: '1.2em' }}>
                            {/* Status: &nbsp; */}
                            {proposal.state === 'Defeated' && proposal.totalVotes < 1000000 &&
                                <span style={{ color: 'red' }}>
                                    <Circle sx={{ height: "10px", width: "10px" }} />&nbsp;
                                    Defeated: No Quorum</span>
                            }
                            {proposal.state === 'Defeated' && proposal.totalVotes >= 1000000 &&
                                <span style={{ color: 'red' }}>
                                    <Circle sx={{ height: "10px", width: "10px" }} />&nbsp;
                                    Defeated</span>
                            }
                            {proposal.state === 'Succeeded' &&
                                <span style={{ color: 'green' }}>
                                    <Circle sx={{ height: "10px", width: "10px" }} />&nbsp; {proposal.state}</span>

                            }
                            {proposal.state === 'Queued' &&
                                <span style={{ color: 'green' }}>
                                    <Circle sx={{ height: "10px", width: "10px" }} />&nbsp; {proposal.state}</span>

                            }
                            {proposal.state === 'Pending' &&
                                <span style={{ color: 'green' }}>
                                    <Circle sx={{ height: "10px", width: "10px" }} />&nbsp; {proposal.state}</span>

                            }
                            {proposal.state === 'Active' && !hasVoted &&
                                <span style={{ fontSize: '0.8em', lineHeight: '1.2em', color: 'yellow', fontWeight: '700' }}>
                                    <Circle sx={{ height: "10px", width: "10px" }} />&nbsp; Proposal active
                                </span>
                            }
                            {proposal.state === 'Active' && hasVoted &&
                                <span style={{ fontSize: '0.8em', lineHeight: '1.2em', color: 'green', fontWeight: '700' }}>
                                    <Circle sx={{ height: "10px", width: "10px" }} />&nbsp; Vote recorded: thank you
                                </span>
                            }
                        </Typography>
                    </Box>
                </S.GridItemTag>

                {proposal.totalVotes > 0 &&
                    <S.GridItemTagR
                    item
                    xs={12}
                    md={12}
                >
                    <Box sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}>
                        <Typography style={{ fontSize: '0.9em', lineHeight: '1.1em', fontWeight: '700' }}>For: {votePercent}%</Typography>
                        <Typography style={{ fontSize: '0.7em', lineHeight: '0.9em', opacity: 0.3 }}>Total: {proposal.totalVotes}</Typography>
                    </Box>
                    <Box sx={{ width: '100%', my: 2 }}>
                        <LinearProgress
                            classes={{ colorPrimary: classes.colorPrimary, barColorPrimary: classes.barColorPrimary }}
                            variant="determinate"
                            value={votePercent}
                        />
                    </Box>
                    <Box sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'flex-start',
                        gap: '20px'
                    }}>
                        <Typography style={{ fontSize: '0.7em', lineHeight: '0.9em', color: 'rgba(255, 255, 255, 0.3)' }}>
                            <Circle sx={{ height: "10px", color: "#83BF6E", width: "10px" }} />  For: {proposal.forVotes}
                        </Typography>
                        <Typography style={{ fontSize: '0.7em', lineHeight: '0.9em', color: 'rgba(255, 255, 255, 0.3)' }}>
                            <Circle sx={{ height: "10px", color: "#FF6A55", width: "10px" }} /> Against: {proposal.againstVotes}
                        </Typography>
                        <Typography style={{ fontSize: '0.7em', lineHeight: '0.9em', color: 'rgba(255, 255, 255, 0.3)' }}>
                            <Circle sx={{ height: "10px", color: "rgba(255, 255, 255, 0.25);", width: "10px" }} /> Abstain: {proposal.abstainVotes}
                        </Typography>
                    </Box>
                </S.GridItemTagR>
                }
                <S.GridItemTag item
                    xs={12}
                    md={12}
                >
                    <Box
                        sx={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'flex-start',
                            gap: '20px'
                        }}
                    >
                        {proposal.state === 'Active' && !hasVoted &&
                            <Button
                                type="primary"
                                variant="outlined"
                                onClick={(e) => { onVote(proposal.id) }}
                            >Vote</Button>
                        }
                        {proposal.state === 'Queued' &&
                            <Button type="primary" variant="outlined" onClick={(e) => { doExecuteProposal() }}>EXECUTE</Button>
                        }
                        {proposal.state === 'Succeeded' &&
                            <Button type="primary" variant="outlined" onClick={(e) => { doQueueProposal() }}>QUEUE</Button>
                        }
                    </Box>
                </S.GridItemTag>
            </S.GridContainer>
        </S.Wrapper>
    )
}


export default React.memo(ListProposal)
