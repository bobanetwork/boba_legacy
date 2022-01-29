import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import React from 'react';
import { Box } from '@material-ui/core';
import * as styles from './Carousel.module.scss'

const responsive = {
  superLargeDesktop: {
    // the naming can be any, depends on you.
    breakpoint: { max: 4000, min: 3000 },
    items: 7
  },
  desktop: {
    breakpoint: { max: 3000, min: 1024 },
    items: 6
  },
  tablet: {
    breakpoint: { max: 1024, min: 580 },
    items: 3
  },
  mobile: {
    breakpoint: { max: 580, min: 0 },
    items: 2
  }
}

function CAROUSEL({
  children
}) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Carousel
        showDots={true}
        keyBoardControl={true}
        responsive={responsive}
        removeArrowOnDeviceType={[ "tablet", "mobile" ]}
        className={styles.multiCarousel}
      >
        {children}
      </Carousel>
    </Box>
  );

}

export default React.memo(CAROUSEL)
