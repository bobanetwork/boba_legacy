import React from 'react'
import { Box, styled, Typography } from '@mui/material'
import CheckMarkIcon from '@mui/icons-material/CheckCircleOutline'

import Carousel from 'react-multi-carousel'
import "react-multi-carousel/lib/styles.css";

import BobaNFTGlass from 'images/boba2/BobaNFTGlass.svg'

import * as G from 'containers/Global.styles'

const NftContainer = styled(Box)(({ theme, active }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  background: active ? theme.palette.background.secondary : theme.palette.background.default,
  borderRadius: theme.palette.primary.borderRadius,
  border: theme.palette.primary.border,
  cursor: 'pointer'
}))

const responsive = {
  superLargeDesktop: {
    // the naming can be any, depends on you.
    breakpoint: { max: 4000, min: 3000 },
    items: 5
  },
  desktop: {
    breakpoint: { max: 3000, min: 1024 },
    items: 5
  },
  tablet: {
    breakpoint: { max: 1024, min: 464 },
    items: 4
  },
  mobile: {
    breakpoint: { max: 464, min: 0 },
    items: 2
  }
};


const VeNftsList = ({ nftRecords, selectedNft, onSelectNft }) => {

  return <Carousel
    showDots={false}
    responsive={responsive}
    keyBoardControl={true}
    customTransition="all .5"
  >
    {nftRecords.map((nft) => {
      return <NftContainer
        key={nft.tokenId}
        m={1}
        p={1}
        active={nft.tokenId === selectedNft?.tokenId}
        onClick={() => { onSelectNft(nft) }}
      >
        {nft.tokenId === selectedNft?.tokenId ?
          <CheckMarkIcon fontSize='small' color="warning"
            sx={{
              position: 'absolute',
              top: '10px',
              right: '10px'
            }}
          /> : null}
        <G.ThumbnailContainer p={1} m={1}>
          <img src={BobaNFTGlass} alt={nft.tokenId} width='100%' height='100%' />
        </G.ThumbnailContainer>
        <Box display="flex" flexDirection="column">
          <Typography variant="body1">#{nft.tokenId}</Typography>
          <Typography variant="body2">{nft.balance.toFixed(2)} <Typography component="span" variant="body3" sx={{ opacity: 0.5 }}>veBoba</Typography> </Typography>
        </Box>
      </NftContainer>
    })}
  </Carousel>
}

export default React.memo(VeNftsList)
