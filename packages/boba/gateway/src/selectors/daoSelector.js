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


export function selectDaoBalance(state) {
    return state.dao.balance
}

export function selectDaoVotes(state) {
    return state.dao.votes
}

export function selectDaoBalanceX(state) {
    return state.dao.balanceX
}

export function selectDaoVotesX(state) {
    return state.dao.votesX
}

export function selectProposals(state) {
    return state.dao.proposalList
}

export function selectLatestProposalState(state) {
    return state.dao.hasLiveProposal
}

export function selectProposalThreshold(state) {
    return state.dao.proposalThreshold
}
