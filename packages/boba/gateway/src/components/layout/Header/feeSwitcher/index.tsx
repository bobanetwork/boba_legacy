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

import React, { FC } from 'react'
import { useSelector } from 'react-redux'

import {
  selectAccountEnabled,
  selectActiveNetworkName,
  selectBobaFeeChoice,
  selectLayer,
} from 'selectors'

import Select from 'components/select/Select'
import Tooltip from 'components/tooltip/Tooltip'

import networkService from 'services/networkService.js'

import useFeeSwitcher from 'hooks/useFeeSwitcher'
import { getCoinImage } from 'util/coinImage'
import {
  FeeLabel,
  FeeSwitcherIcon,
  FeeSwitcherLabel,
  FeeSwitcherLabelWrapper,
  FeeSwitcherWrapper,
} from './styles'

import BobaLogo from 'assets/images/Boba_Logo_White_Circle.png'

const OptionBoba = () => ({
  value: 'BOBA',
  title: 'BOBA',
  icon: BobaLogo,
})

const OptionNativeToken = () => ({
  value: networkService.L1NativeTokenSymbol,
  title: networkService.L1NativeTokenName,
  icon: getCoinImage(networkService.L1NativeTokenSymbol),
})

const FeeSwitcher: FC = () => {
  const accountEnabled = useSelector(selectAccountEnabled())
  const feeUseBoba = useSelector(selectBobaFeeChoice())
  const networkName = useSelector(selectActiveNetworkName())
  const layer = useSelector(selectLayer())

  const { switchFeeUse } = useFeeSwitcher()

  if (!accountEnabled && layer !== 'L2') {
    return (
      <FeeSwitcherWrapper>
        <Tooltip
          title={`After switching to the Boba network, you can modify the Gas fee token used by the Boba network. The whole network will use BOBA or ${networkService.L1NativeTokenSymbol} as the gas fee token according to your choice.`}
        >
          <FeeSwitcherIcon fontSize="small" />
        </Tooltip>
        <FeeSwitcherLabel>Fee</FeeSwitcherLabel>
      </FeeSwitcherWrapper>
    )
  }

  return (
    <FeeSwitcherWrapper>
      <FeeSwitcherLabelWrapper>
        <FeeLabel>Fee</FeeLabel>
        <Tooltip
          title={`BOBA or ${networkService.L1NativeTokenSymbol} will be used across ${networkName['l2']} according to your choice.`}
        >
          <FeeSwitcherIcon fontSize="small" />
        </Tooltip>
      </FeeSwitcherLabelWrapper>
      <Select
        isMulti={false}
        loading={false}
        newSelect={true}
        label=""
        className=""
        onSelect={(e: any) => {
          switchFeeUse(e.value)
        }}
        value={feeUseBoba ? OptionBoba() : OptionNativeToken()}
        options={[OptionBoba(), OptionNativeToken()]}
      />
    </FeeSwitcherWrapper>
  )
}

export default FeeSwitcher
