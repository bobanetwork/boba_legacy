import React, { useEffect, useState } from 'react'
import { Box } from '@material-ui/system'
import { useSelector } from 'react-redux'
import * as S from './GasSwitcher.styles.js'
import { ethers } from 'ethers'

import { selectGas } from 'selectors/balanceSelector'
import { Typography } from '@material-ui/core'

import networkService from 'services/networkService.js'

function GasSwitcher() {

  const gas = useSelector(selectGas)
  const [savings, setSavings] = useState(0)

  useEffect(() => {
    async function getGasSavings () {
      const l2GasPrice = await networkService.L2Provider.getGasPrice();
      const l2GasEstimate = await networkService.L2Provider.estimateGas({
        from: '0x5E7a06025892d8Eef0b5fa263fA0d4d2E5C3B549',
        to: '0x17C83E2B96ACfb5190d63F5E46d93c107eC0b514',
        value: '0x38d7ea4c68000',
        data:
          '0x7ff36ab5000000000000000000000000000000000000000000000000132cc41aecbfbace00000000000000000000000000000000000000000000000000000000000000800000000000000000000000005e7a06025892d8eef0b5fa263fa0d4d2e5c3b54900000000000000000000000000000000000000000000000000000001c73d14500000000000000000000000000000000000000000000000000000000000000002000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead00000000000000000000000000005008f837883ea9a07271a1b5eb0658404f5a9610',
      });
      const l1GasCost = await networkService.gasOralceContract.getL1Fee(
        ethers.utils.serializeTransaction({
          to: '0x17C83E2B96ACfb5190d63F5E46d93c107eC0b514',
          value: '0x38d7ea4c68000',
          data:
            '0x7ff36ab5000000000000000000000000000000000000000000000000132cc41aecbfbace00000000000000000000000000000000000000000000000000000000000000800000000000000000000000005e7a06025892d8eef0b5fa263fa0d4d2e5c3b54900000000000000000000000000000000000000000000000000000001c73d14500000000000000000000000000000000000000000000000000000000000000002000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead00000000000000000000000000005008f837883ea9a07271a1b5eb0658404f5a9610',
        })
      );
      const totalGasCostWei = l2GasPrice.mul(l2GasEstimate).add(l1GasCost).toNumber();
      console.log({
        gasL1: gas.gasL1,
        l2GasEstimate: l2GasEstimate.toNumber(),
        gasL2: gas.gasL2,
        totalGasCostWei: totalGasCostWei,
      })
      const gasSavings = Number(gas.gasL1) * l2GasEstimate.toNumber() / (Number(gas.gasL2) + totalGasCostWei / Math.pow(10, 9));
      setSavings(gasSavings ? gasSavings : 0);
      return gasSavings
    }
    getGasSavings();
  }, [gas]);

  return (
    <S.WalletPickerContainer>
      <S.WalletPickerWrapper>
        <S.Menu>
          <S.NetWorkStyle>
            <S.Label variant="body2">
              Ethereum Gas<br/>
              Boba Gas<br/>
              Savings<br/>
              L1 Block<br/>
              L2 Block
            </S.Label>
            <Box sx={{
              display: 'flex',
              margin: '10px 0 10px 10px',
              alignItems: 'center',
              gap: 2,
              position: 'relative',
            }}
            >
              <Typography
                variant="body2"
                sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', textTransform: 'capitalize'}}
              >
                {gas.gasL1} Gwei<br/>
                {gas.gasL2} Gwei<br/>
                {savings.toFixed(0)}x<br/>
                {gas.blockL1}<br/>
                {gas.blockL2}
              </Typography>
            </Box>
          </S.NetWorkStyle>
        </S.Menu>
      </S.WalletPickerWrapper>
    </S.WalletPickerContainer>
  )

}

export default GasSwitcher
