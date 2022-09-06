import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'

import * as S from './Dao/Dao.styles';
import * as G from '../Global.styles'
import PageTitle from 'components/pageTitle/PageTitle';
import Tabs from 'components/tabs/Tabs';
import { useDispatch, useSelector } from 'react-redux';
import { selectLockRecords } from 'selectors/veBobaSelector';
import { selectAccountEnabled, selectLayer } from 'selectors/setupSelector';
import { fetchLockRecords } from 'actions/veBobaAction';
import Vote from './Vote/Vote';
import Dao from './Dao/Dao';
import { setConnectBOBA } from 'actions/setupAction';

const DAO_TABS = {
  VOTE: "Liquidity Bootstrapping",
  PROPOSAL: "Proposals",
}

function VoteAndDAO() {

  const [ page, setPage ] = useState(DAO_TABS.VOTE);
  const [ balance, setBalance ] = useState('--');

  const dispatch = useDispatch()
  const nftRecords = useSelector(selectLockRecords);
  const accountEnabled = useSelector(selectAccountEnabled())
  const layer = useSelector(selectLayer())


  async function connectToBOBA() {
    dispatch(setConnectBOBA(true))
  }

  useEffect(() => {
    if (!!accountEnabled && layer === 'L2') {
      dispatch(fetchLockRecords());
    }
  }, [ accountEnabled, dispatch, layer ]);

  useEffect(() => {
    if (!!accountEnabled) {
      const veBoba = nftRecords.reduce((s, record) => s + Number(record.balance), 0);
      setBalance(veBoba.toFixed(2))
    }
  }, [ accountEnabled, nftRecords ]);

  const veNftDisclaimer = () => {
    if (page !== DAO_TABS.VOTE) {
      return null;
    }

    return (<G.Content flex={1} p={2}>
      <Typography variant='body3'>
        Votes are due by Wednesday at 23:59 UTC, when the next epoch begins. Each veNFT can only cast votes once per epoch. Your vote will allocate 100% of that veNFT's vote-power. Each veNFT's votes will carry over into the next epoch. However, you must resubmit each veNFT's vote in each epoch to earn the bribes placed in that epoch. Voters will earn bribes no matter when in the epoch the bribes are added.
      </Typography>
      <Typography variant='body3' component="p" width="100%" sx={{ opacity: 0.65 }}>
        For details refer to our Docs
      </Typography>
    </G.Content>)
  }

  const handlePageChange = (type) => {
    if (DAO_TABS.VOTE === type) {
      setPage(DAO_TABS.VOTE)
    } else if (DAO_TABS.PROPOSAL === type) {
      setPage(DAO_TABS.PROPOSAL)
    }
  }

  return <S.DaoPageContainer>
    <PageTitle title={'My voting power'} />
    {/* page hero section */}
    <Box display="flex" gap={2}>
      <Box mb={1} gap={1} p={2} width='30%'>
        <Typography variant="body2" style={{ opacity: '0.5' }}>My total voting power</Typography>
        <Typography variant="h2" >{balance}</Typography>
        <Typography variant="body2" style={{ opacity: '0.5' }}>govBOBA</Typography>
      </Box>
      {veNftDisclaimer()}
    </Box>

    {/* page tabs section */}
    <Box sx={{ mt: 2 }}>
      <Tabs
        activeTab={page}
        onClick={(t) => handlePageChange(t)}
        aria-label="Page Tab"
        tabs={[ DAO_TABS.VOTE, DAO_TABS.PROPOSAL ]}
      />
    </Box>
    {/* page content section */}
    {DAO_TABS.VOTE === page ?
      <Vote
        connectToBOBA={connectToBOBA}
      />
      : <Dao
        connectToBOBA={connectToBOBA}
      />}


  </S.DaoPageContainer>
}


export default React.memo(VoteAndDAO);
