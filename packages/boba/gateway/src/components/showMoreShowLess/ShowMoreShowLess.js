import React, { useState } from 'react'
import { Typography } from '@mui/material';

const ShowMoreShowLess = ({
  children,
  limit = 50,
  sx
}) => {
  const text = children;

  const [ showMore, setshowMore ] = useState(false);

  return (
    <Typography variant='body3' sx={sx}>
      {showMore ? text : text.substr(0, limit)}
      {text.length > limit ?
        <Typography
          variant='body3'
          sx={{
            display: 'inline',
            cursor: 'pointer',
          }}
          color="primary"
          component="span"
          onClick={() => setshowMore(!showMore)}
        >
          {showMore ? 'show less' : '... show more'}
        </Typography>
        : null}
    </Typography>
  )

}

export default ShowMoreShowLess
