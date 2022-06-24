import { Box, Grid, Typography } from '@mui/material'
import Button from 'components/button/Button'
import BobaNFTGlass from 'images/boba2/BobaNFTGlass.svg'
import React from 'react'
import * as S from './RecordItem.styles'

function RecordItem({
  key,
}) {

  return <Grid container px={2} py={1} >
    <Grid item md={3}>
      <Box display="flex" alignItems="center" gap={2}>
        <S.ThumbnailContainer px={2} py={1}>
          <img src={BobaNFTGlass} alt="glass"/>
        </S.ThumbnailContainer>
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
    <Grid item md={3} >
      <Box display="flex" justifyContent="flex-end" alignItems="center">
      <Button
        variant='outlined'
        color='primary'
        size="small">Manage</Button>
      </Box>
    </Grid>
  </Grid>

}

export default React.memo(RecordItem);
