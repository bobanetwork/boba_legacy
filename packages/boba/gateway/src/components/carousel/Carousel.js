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
    breakpoint: { max: 3000, min: 1179 },
    items: 6
  },
  tablet: {
    breakpoint: { max: 1179, min: 667 },
    items: 4
  },
  mobile: {
    breakpoint: { max: 667, min: 0 },
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
        containerClass={styles.carouselContainer}
      >
        {children}
      </Carousel>
    </Box>
  );

}

export default React.memo(CAROUSEL)
