/*
Copyright 2019-present OmiseGO Pte Ltd

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
import { Typography, useTheme, Link, Fade } from '@material-ui/core'

import { useDispatch } from 'react-redux';
import { openAlert, openError } from 'actions/uiAction'
import { castProposalVote, queueProposal, executeProposal } from 'actions/daoAction'

import moment from 'moment'
import Button from 'components/button/Button'
import * as S from "./listProposal.styles"

function Proposal({
    proposal,
}) {

    const dispatch = useDispatch()

    const [dropDownBox, setDropDownBox] = useState(false)
    const [votePercent, setVotePercent] = useState(undefined)
    
    useEffect(() => {
        const init = async () => {
            if (proposal.totalVotes > 0) {
                setVotePercent(Math.round((100 * proposal.forVotes) / proposal.totalVotes))
            } else {
                setVotePercent(50);
            }
        };
        init()
    }, [proposal])


    const updateVote = async (id, userVote, label) => {
        let res = await dispatch(castProposalVote({id, userVote}));
        if(res) {
            dispatch(openAlert(`${label}`));
        } else {
            dispatch(openError(`Failed to cast vote!`));
        }
    }

    const doQueueProposal = async () => {
        let res = await dispatch(queueProposal(proposal.id))
        if(res) {
            dispatch(openAlert(`Proposal is queuing`));
        } else {
            dispatch(openError(`Failed to queue proposal`));
        }
    }

    const doExecuteProposal = async () => {
        let res = await dispatch(executeProposal(proposal.id))
        if(res) {
            dispatch(openAlert(`Proposal is executing`));
        } else {
            dispatch(openError(`Failed to execute proposal`));
        }
    }

    const FormatDescription = ({description}) =>{
        if(!!description.includes('@@')) {
            let descList = description.split('@@')
            if(descList[1] !== '') {
                //should validate http link
                return  <>{descList[0]}&nbsp;&nbsp;<Link color="inherit" variant="body2" target="_blank" rel="noopener noreferrer" href={descList[1]}>MORE DETAILS</Link>  </>
            } else {
                return  <>{descList[0]}</>
            }
        } 
        return <>{description}</>;
    }

    const startTime = moment.unix(proposal.startTimestamp).format('lll')
    const endTime = moment.unix(proposal.endTimestamp).format('lll')

    return (
        <S.Wrapper dropDownBox={dropDownBox}>
            <S.GridContainer container
              spacing={1}
              direction="row"
              justifyContent="flex-start"
              alignItems="center"
            >
                <S.GridItemTag item
                  xs={12}
                  md={8}
                >
                    <Typography variant="body2" style={{fontWeight: '700'}}>Proposal {proposal.id}: <FormatDescription description={proposal.description} /></Typography>
                    {proposal.state === 'Defeated' && 
                        <Typography variant="overline" style={{fontSize: '0.8em', lineHeight: '1.2em'}}>
                          Status: &nbsp;<span style={{color: 'red'}}>{proposal.state}</span>
                        </Typography>
                    }
                    {proposal.state === 'Succeeded' && 
                        <Typography variant="overline" style={{fontSize: '0.8em', lineHeight: '1.2em'}}>
                            Status: &nbsp;<span style={{color: 'green'}}>{proposal.state}</span>
                        </Typography>
                    }
                    {proposal.state === 'Queued' && 
                        <Typography variant="overline" style={{fontSize: '0.8em', lineHeight: '1.2em'}}>
                            Status: &nbsp;<span style={{color: 'green'}}>{proposal.state}</span>
                        </Typography>
                    }
                    {proposal.state !== 'Succeeded' && proposal.state !== 'Defeated' &&
                        <Typography variant="overline" style={{fontSize: '0.8em', lineHeight: '1.2em'}}>
                          Status: &nbsp;<span style={{color: 'yellow'}}>{proposal.state}</span>
                        </Typography>
                    }
                    <Typography variant="overline" style={{fontSize: '0.8em', lineHeight: '1.2em'}}>
                        Voting Start: <span style={{color: 'rgba(255, 255, 255, 0.3)'}}>{startTime}</span>
                    </Typography>
                    <Typography variant="overline" style={{fontSize: '0.8em', lineHeight: '1.2em'}}>
                        Voting Stop: <span style={{color: 'rgba(255, 255, 255, 0.3)'}}>{endTime}</span> 
                    </Typography>
                    {proposal.state === 'Active' && !proposal.hasVoted &&
                        <Typography variant="overline" style={{fontSize: '0.8em', lineHeight: '1.2em', color: 'yellow', fontWeight: '700'}}>
                          Proposal active 
                        </Typography>
                    }
                    {proposal.state === 'Active' && proposal.hasVoted &&
                        <Typography variant="overline" style={{fontSize: '0.8em', lineHeight: '1.2em', color: 'green', fontWeight: '700'}}>
                          Vote recorded: thank you
                        </Typography>
                    }
                </S.GridItemTag>
                <S.GridItemTag item
                    xs={12}
                    md={2}
                >
                    {proposal.state === 'Active' && !proposal.hasVoted &&
                        <Button type="primary" variant="contained" onClick={()=>{setDropDownBox(!dropDownBox)}}>VOTE</Button>
                    }
                    {proposal.state === 'Queued' && 
                        <Button type="primary" variant="contained" onClick={(e)=>{doExecuteProposal()}}>EXECUTE</Button>
                    }
                    {proposal.state === 'Succeeded' && 
                        <Button type="primary" variant="contained" onClick={(e)=>{doQueueProposal()}}>QUEUE</Button>
                    }
                </S.GridItemTag>
                <S.GridItemTagR 
                    item
                    xs={12}
                    md={2}
                >
                    <Typography variant="overline" style={{fontSize: '0.9em', lineHeight: '1.1em', fontWeight: '700'}}>For: {votePercent}%</Typography>
                    <Typography variant="overline" style={{fontSize: '0.7em', lineHeight: '0.9em', color: 'rgba(255, 255, 255, 0.3)'}}>For: {proposal.forVotes}</Typography>
                    <Typography variant="overline" style={{fontSize: '0.7em', lineHeight: '0.9em', color: 'rgba(255, 255, 255, 0.3)'}}>Against: {proposal.againstVotes}</Typography>
                    <Typography variant="overline" style={{fontSize: '0.7em', lineHeight: '0.9em', color: 'rgba(255, 255, 255, 0.3)'}}>Abstain: {proposal.abstainVotes}</Typography>
                    <Typography variant="overline" style={{fontSize: '0.7em', lineHeight: '0.9em', color: 'rgba(255, 255, 255, 0.3)'}}>Total Votes: {proposal.totalVotes}</Typography>
                </S.GridItemTagR>
        </S.GridContainer>
        {dropDownBox ? (
          <Fade in={dropDownBox}>
            <S.DropdownContent>
              <S.DropdownWrapper>
                <Button
                    type="primary"
                    variant="contained"
                    onClick={(e) => {updateVote(proposal.id, 1, 'Cast Vote For')}}
                >Vote For</Button>
                <Button
                    type="primary"
                    variant="contained"
                    onClick={(e) => {updateVote(proposal.id, 0, 'Cast Vote Against')}}
                >Vote Against</Button>
                <Button
                    type="outline"
                    variant="contained"
                    onClick={(e) => {updateVote(proposal.id, 2, 'Cast Vote Abstain')}}
                >Vote Abstain</Button>
              </S.DropdownWrapper>
            </S.DropdownContent>
          </Fade>
        ) : null }
    </S.Wrapper>
    )
}


export default React.memo(Proposal)