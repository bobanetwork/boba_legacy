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

import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { Typography } from '@mui/material'

import Proposal from 'components/Proposal/Proposal'

import * as S from './ProposalList.styles'
import * as styles from './proposalList.module.scss'

import { selectProposals } from 'selectors/daoSelector'
import { selectLoading } from 'selectors/loadingSelector'

import { orderBy } from 'lodash'
import Select from 'components/select/Select'

const PER_PAGE = 8

function ProposalList() {

    const [selectedState, setSelectedState] = useState('All')

    const loading = useSelector(selectLoading([ 'PROPOSALS/GET' ]))
    const proposals = useSelector(selectProposals)

    const options = [
        {value: 'All', title: 'All'},
        {value: 'Pending', title: 'Pending'},
        {value: 'Active', title: 'Active'},
        {value: 'Canceled', title: 'Canceled'},
        {value: 'Defeated', title: 'Defeated'},
        {value: 'Succeeded', title: 'Succeeded'},
        {value: 'Queued', title: 'Queued'},
        {value: 'Expired', title: 'Expired'},
        {value: 'Executed', title: 'Executed'}
      ]


    const onActionChange = (e) => {
        setSelectedState(e.target.value);
    }

    const orderedProposals = orderBy(proposals, i => i.startTimestamp, 'desc')

    // const startingIndex = page === 1 ? 0 : ((page - 1) * PER_PAGE)
    // const endingIndex = page * PER_PAGE
    // const paginatedProposals = orderedProposals.slice(startingIndex, endingIndex)
    const paginatedProposals = orderedProposals;

    let totalNumberOfPages = Math.ceil(orderedProposals.length / PER_PAGE)
    if (totalNumberOfPages === 0) totalNumberOfPages = 1

    return <>
        <S.DaoProposalHead>
            <Typography variant="h3">Proposal</Typography>
            <Select
                options={options}
                onSelect={onActionChange}
                sx={{ marginBottom: '20px' }}
                value={selectedState}
            ></Select>
        </S.DaoProposalHead>
        <S.DividerLine />
        <S.DaoProposalListContainer>
            {!!loading && !proposals.length ? <div className={styles.loadingContainer}> Loading... </div> : null}
            {paginatedProposals
                // eslint-disable-next-line array-callback-return
                .filter((p) => {
                    if (selectedState === 'All') {
                        return true;
                    }
                    return selectedState === p.state;
                })
                .map((p, index) => {
                return <React.Fragment key={index}>
                    <Proposal proposal={p} />
                </React.Fragment>
            })}
        </S.DaoProposalListContainer>
    </>
}

export default React.memo(ProposalList)
