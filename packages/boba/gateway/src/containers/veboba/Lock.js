import { Box, Typography } from '@mui/material'
import React, { useEffect } from 'react'
import { fetchLockRecords } from 'actions/veBobaAction'
import AreaChart from 'components/areaChart/AreaChart'

import * as G from '../Global.styles'
import * as S from './Lock.styles'

import CreateLock from './createLock/CreateLock'
import LockRecords from './Records/Records'
import { useDispatch, useSelector } from 'react-redux'
import { selectAccountEnabled } from 'selectors/setupSelector'

const data = [
  { name: '0', uv: 0 },
  { name: '3M', uv: 25 },
  { name: '6M', uv: 50 },
  { name: '12M', uv: 100 }
]


function Lock() {
  const dispatch = useDispatch();
  const accountEnabled = useSelector(selectAccountEnabled())

  useEffect(() => {
    if (!!accountEnabled) {
      dispatch(fetchLockRecords());
    }
  }, [ accountEnabled, dispatch ]);


  return <S.PageContainer>
    <Box display="flex" container gap={3} flexDirection="column">
      <Box display="flex" justifyContent='space-around' gap={4}>
        <Box sx={{ width: '100%' }}>
          <Typography variant="h2">Lock for Vote</Typography>
          <Typography variant="body2" sx={{ opacity: 0.6 }}>More tokens locked for longer = greater voting power = higher rewards</Typography>
          <G.DividerLine sx={{ my: 2 }} />
          <Typography variant="h3">Locking Period vs Convert Ratio</Typography>
          <Typography variant="body2">100 Boba locked for 6M = 50 veBoba</Typography>
          <Box py={2}>
            <AreaChart data={data} />
          </Box>
        </Box>
        <CreateLock />
      </Box>
      <Box py={2}>
        <S.LockRecordTitle p={2}>
          <Typography variant='h4'>Lock Records</Typography>
        </S.LockRecordTitle>
        <LockRecords />
      </Box>
    </Box >
  </S.PageContainer>

}


export default React.memo(Lock)
