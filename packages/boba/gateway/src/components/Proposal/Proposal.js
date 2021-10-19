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

import React, { useState, useEffect } from 'react';
import {Typography, useTheme, Link} from '@material-ui/core';

import { useDispatch } from 'react-redux';

import { openAlert, openError } from 'actions/uiAction';
import { castProposalVote } from 'actions/daoAction';

import Button from 'components/button/Button';

import * as styles from './Proposal.module.scss';

import { backgroundLight400 } from 'index.scss';

function Proposal({
    proposal,
}) {

    const dispatch = useDispatch()
    const theme = useTheme()

    const [dropDownBox, setDropDownBox] = useState(false)
    const [dropDownBoxInit, setDropDownBoxInit] = useState(true)

    const [votePercent, setVotePercent] = useState(undefined)
    
    useEffect(() => {
        const init = async () => {
            if (proposal.totalVotes > 0) {
                setVotePercent(Math.round((100 * proposal.forVotes) / proposal.totalVotes));
            } else {
                setVotePercent(50);
            }
        };
        init();
    }, [proposal])


    const updateVote = async (id, userVote, label) => {
        let res = await dispatch(castProposalVote({id, userVote}));
        if(res) {
            dispatch(openAlert(`${label}`));
        } else {
            dispatch(openError(`Failed to cast vote!`));
        }
    }

    const FormatDescription = ({description}) =>{
        if(!!description.includes('@@')) {
            let descList = description.split('@@')
            if(descList[1] !== '') {
                //should validate http link
                return  <>{descList[0]}&nbsp;&nbsp;<Link color="inherit" variant="body2" className={styles.href} target="_blank" rel="noopener noreferrer" href={descList[1]}>MORE DETAILS</Link>  </>
            } else {
                return  <>{descList[0]}</>
            }
        } 
        return <>{description}</>;
    }

    return (<div
        className={styles.proposalCard}

        style={{
            background: `${theme.palette.mode === 'light' ? backgroundLight400 : 'linear-gradient(132.17deg, rgba(255, 255, 255, 0.1) 0.24%, rgba(255, 255, 255, 0.03) 94.26%)'}`,
            borderRadius: '12px'
        }}>

        <div
            onClick={() => {
                if(proposal.state !== 'Active') {
                    return;
                }
                if(proposal.hasVoted) {
                    return;
                }
                setDropDownBox(!dropDownBox)
                setDropDownBoxInit(false)
            }}
        >
            <div className={styles.proposalHeader}>
                <div className={styles.title}>
                    <p>Proposal #{proposal.id}</p>
                    <Typography variant="body3" component="p" className={styles.muted}>Title: <FormatDescription description={proposal.description} /></Typography>
                    <Typography variant="body3" component="p" className={styles.muted}>Status: {proposal.state}</Typography>
                    <Typography variant="body3" component="p" className={styles.muted}>Start L1 Block: {proposal.startBlock} &nbsp; &nbsp; End L1 Block: {proposal.endBlock}</Typography>
                    {proposal.state === 'Active' && !proposal.hasVoted &&
                         <div style={{
                            background: 'blue', 
                            borderRadius: '8px',
                            height: '25px',
                            fontSize: '0.9em',
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'center'
                        }}>Proposal active: please VOTE</div>
                    }
                    {proposal.state === 'Active' && proposal.hasVoted &&
                         <div style={{
                            background: 'green', 
                            borderRadius: '8px',
                            height: '25px',
                            fontSize: '0.9em',
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'center'
                        }}>Vote recorded: thank you</div>
                    }
                </div>
                <div>
                    <Typography variant="body3" component="p" className={styles.vote}>For: {proposal.forVotes}</Typography>
                    <Typography variant="body3" component="p" className={styles.vote}>Against: {proposal.againstVotes}</Typography>
                    <Typography variant="body3" component="p" className={styles.vote}>Abstain: {proposal.abstainVotes}</Typography>
                    <Typography variant="body3" component="p" className={styles.vote} style={{minWidth: '150px'}}>Percentage For: {votePercent}% </Typography>
                    <Typography variant="body3" component="p" className={styles.vote}>Total Votes: {proposal.totalVotes}</Typography>
                </div>
            </div>
        </div>

        <div className={dropDownBox ? styles.dropDownContainer : dropDownBoxInit ? styles.dropDownInit : styles.closeDropDown}>
            <div className={styles.proposalDetail}>
                <Typography variant="body2">Note: only your first vote counts.</Typography>
                <Button
                    type="primary"
                    variant="outlined"
                    style={{
                        maxWidth: '180px',
                        padding: '15px 10px',
                        borderRadius: '8px',
                        alignSelf: 'center'
                    }}
                    onClick={(e) => {
                        updateVote(proposal.id, 1, 'Cast Vote For')
                    }}

                > Cast Vote For</Button>
                <Button
                    type="primary"
                    variant="outlined"
                    style={{
                        maxWidth: '180px',
                        padding: '15px 10px',
                        borderRadius: '8px',
                        alignSelf: 'center'
                    }}
                    onClick={(e) => {
                        updateVote(proposal.id, 0, 'Cast Vote Against')
                    }}

                > Cast Vote Against</Button>
                <Button
                    type="outline"
                    variant="outlined"
                    style={{
                        maxWidth: '180px',
                        padding: '15px 10px',
                        borderRadius: '8px',
                        alignSelf: 'center'
                    }}
                    onClick={(e) => {
                        updateVote(proposal.id, 2, 'Cast Vote Abstain')
                    }}
                > Cast Vote Abstain</Button>
            </div>
        </div>
    </div>)
}


export default React.memo(Proposal)