/*
Copyright 2021-present Boba Network.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import React, { useEffect, useState } from 'react'
import { Box, Typography, Slider } from '@mui/material'

import bobaLogo from 'images/boba-token.svg'

import * as G from 'containers/Global.styles'
import * as S from './poolList.style'


function PoolListItem({}) {


  return <S.ListItemContent>
    <G.TableBody>
      <G.TableCell pl={1} py={2}>
        <img src={bobaLogo} alt="boba logo" width={25} height={25} />
        <Box display="flex" flexDirection="column">
          <Typography variant="body2">
            BOBA-ETH
          </Typography>
          <Typography variant="body4" sx={{ opacity: 0.65 }}>
            olongswap LP
          </Typography>
        </Box>
      </G.TableCell>
      <G.TableCell pl={1} py={2}>
        <Box display="flex" flexDirection="column" alignItems="flex-start">
          <Typography variant="body2">
            220,500,000.00
          </Typography>
          <Typography variant="body4" sx={{ opacity: 0.65 }}>
            30%
          </Typography>
        </Box>
      </G.TableCell>
      <G.TableCell pl={1} py={2}>
        <Box display="flex" flexDirection="column" alignItems="flex-start">
          <Typography variant="body2">
            0
          </Typography>
          <Typography variant="body4" sx={{ opacity: 0.65 }}>
            0%
          </Typography>
        </Box>
      </G.TableCell>
      <G.TableCell pl={1} py={2} width="40%" flex="2">
        <Box display="flex" width="100%" alignItems="center" justifyContent="space-around" gap={2}>
          <Typography variant="body2">
            0%
          </Typography>
          <Slider
            defaultValue={30}
            valueLabelDisplay="auto"
            step={1}
            min={0}
            max={100}
          />
        </Box>
      </G.TableCell>
    </G.TableBody>
  </S.ListItemContent>
}

export default PoolListItem;
