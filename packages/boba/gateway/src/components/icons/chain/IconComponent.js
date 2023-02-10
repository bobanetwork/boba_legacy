import React from 'react';
import { Box } from '@mui/system';
import EthereumIcon from './L1/EthereumIcon';
import BNBIcon from './L1/BNBIcon';
import AvalancheIcon from './L1/AvalancheIcon';
import FantomIcon from './L1/FantomIcon';
import MoonbeamIcon from './L1/MoonbeamIcon';

import BobaIcon from './L2/BobaIcon';
import BobaBNBIcon from './L2/BobaBNBIcon';
import BobaAvaxIcon from './L2/BobaAvaxIcon';
import BobaFantomIcon from './L2/BobaFantomIcon';
import BobabeamIcon from './L2/BobabeamIcon';
import { Typography } from '@mui/material';

const IconComponent = () => {

  return <>
    <Box display="flex">
      <Box display="flex" margin="auto" p="5" gap={2}>
        <Typography>
          Selected State
        </Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          <EthereumIcon selected={true} />
          <BNBIcon selected={true} />
          <AvalancheIcon selected={true} />
          <FantomIcon selected={true} />
          <MoonbeamIcon selected={true} />
        </Box>
        <Box display="flex" flexDirection="column" gap={2}>
          <BobaIcon selected={true} />
          <BobaBNBIcon selected={true} />
          <BobaAvaxIcon selected={true} />
          <BobaFantomIcon selected={true} />
          <BobabeamIcon selected={true} />
        </Box>
      </Box><Box display="flex" margin="auto" p="5" gap={2}>
        <Typography>
          Default State
        </Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          <EthereumIcon />
          <BNBIcon />
          <AvalancheIcon />
          <FantomIcon />
          <MoonbeamIcon />
        </Box>
        <Box display="flex" flexDirection="column" gap={2}>
          <BobaIcon />
          <BobaBNBIcon />
          <BobaAvaxIcon />
          <BobaFantomIcon />
          <BobabeamIcon />
        </Box>
      </Box>
    </Box>
  </>

}


export default IconComponent;
