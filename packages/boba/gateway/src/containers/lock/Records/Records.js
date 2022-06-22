import { Typography, Box, Grid } from '@mui/material'
import React from 'react'
import BobaNFTGlass from 'images/boba2/BobaNFTGlass.svg'
import Button from 'components/button/Button'

function LockRecords({

}) {


  return <>
    <Grid container p={2} >
      <Grid item md={3}>
        <Typography variant="body2">
          NFT ID / Lock Expires
        </Typography>
      </Grid>
      <Grid item md={3}>
        <Typography variant="body2">
          Lock Amount
        </Typography>
      </Grid>
      <Grid item md={3}>
        <Typography variant="body2">
          Vote Value
        </Typography>
      </Grid>
      <Grid item md={3}> </Grid>
    </Grid>
    <Grid container px={2} py={1} >
      <Grid item md={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box>
            <img src={BobaNFTGlass} alt="glass" />
          </Box>
          <Box display="flex" flexDirection="column" alignItems="flex-start">
            <Typography variant="body2">#7698</Typography>
            <Typography variant="body2" >2022-07-07</Typography>
            <Typography variant="body4" sx={{ opacity: 0.5 }} >Expires in month</Typography>
          </Box>
        </Box>
      </Grid>
      <Grid item md={3}>
        <Box display="flex" flexDirection="column" alignItems="flex-start">
          <Typography variant="body2">500</Typography>
          <Typography variant="body4" sx={{ opacity: 0.5 }} >Boba</Typography>
        </Box>
      </Grid>
      <Grid item md={3}>
        <Box display="flex" flexDirection="column" alignItems="flex-start">
          <Typography variant="body2">500</Typography>
          <Typography variant="body4" sx={{ opacity: 0.5 }}>veBoba</Typography>
        </Box>
      </Grid>
      <Grid item md={3}>
        <Button size="small">Manage</Button>
      </Grid>
    </Grid>
  </>

}

export default React.memo(LockRecords)
