import React from 'react'
import { LabelContainer } from './styles'
/*
            <Typography
              variant="overline"
              style={{ fontSize: '0.8em', lineHeight: '1.2em' }}
            >
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
                    }*/

export const Label = (props: { status: string }) => {
  return <LabelContainer state={props.status}>{props.status}</LabelContainer>
}
