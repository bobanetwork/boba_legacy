import React from 'react'
import { Typography, Grid, Box, } from '@mui/material'

import PageTitle from 'components/pageTitle/PageTitle'
import AreaChart from 'components/areaChart/AreaChart'
import Input from 'components/input/Input'

import * as S from './Lock.styles'
import * as G from '../Global.styles'

import LockRecords from './Records/Records'

const data = [
  { name: '6', uv: 4000, pv: 2400, amt: 2400 },
  { name: '12', uv: 3000, pv: 1398, amt: 2210 },
  { name: '18', uv: 2000, pv: -9800, amt: 2290 },
  { name: '24', uv: 2780, pv: 3908, amt: 2000 },
  { name: '30', uv: 2500, pv: 4800, amt: 2181 },
  { name: '36', uv: 1220, pv: 3800, amt: 2500 },
  { name: '42', uv: 2300, pv: 4300, amt: 2100 },
]


function Lock() {

  return <S.PageContainer>
    <Box display="flex" container gap={3} flexDirection="column">
      <Box display="flex" justifyContent='space-around' gap={4}>
        <Box sx={{width: '100%'}}>
          <Typography variant="h2">Lock for Vote</Typography>
          <Typography variant="body2" sx={{ opacity: 0.6 }}>More tokens locked for longer = greater voting power = higher rewards</Typography>
          <G.DividerLine sx={{ my: 2 }} />
          <Typography variant="h3">Locking Period vs Convert Ration</Typography>
          <Typography variant="body2">100 Boba locked for 36M = 84 veBoba</Typography>
          <Box py={2}>
            <AreaChart data={data} />
          </Box>
        </Box>
        <S.LockFormContainer p={4} gap={2}>
          <Typography variant="h2">Create New Lock</Typography>
          <G.DividerLine sx={{ my: 2 }} />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="body2"> BOBA Balance:</Typography>
            <Typography variant="body2"> 0 </Typography>
          </Box>
          <Input
            value={0}
            type="number"
            maxValue={0}
            onChange={i => {}}
            onUseMax={i => {}}
            newStyle
            // disabled={netLayer !== 'L2'}
            variant="standard"
          />

        </S.LockFormContainer>
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
