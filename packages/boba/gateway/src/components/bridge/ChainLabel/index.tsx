import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import {
  selectActiveNetworkName,
  selectActiveNetworkIcon,
  selectLayer,
} from 'selectors'
import { DEFAULT_NETWORK, LAYER } from 'util/constant'
import { L1_ICONS, L2_ICONS } from 'util/network/network.util'
import { ChainLabelContainer } from './styles'
import { IconType, ChainLabelInterface, DirectionType } from './types'

export const ChainLabel = ({ direction }: ChainLabelInterface) => {
  const [toL2, setToL2] = useState(true)

  const layer = useSelector(selectLayer())
  const networkName = useSelector(selectActiveNetworkName())
  const icon: keyof IconType = useSelector(selectActiveNetworkIcon())

  const isL1 = layer === LAYER.L1

  useEffect(() => {
    setToL2(isL1)
  }, [isL1])

  const L1Icon = L1_ICONS[icon]
  const L2Icon = L2_ICONS[icon]

  const L1ChainLabel = () => {
    return (
      <ChainLabelContainer variant="body2">
        <L1Icon selected />
        {networkName['l1'] || DEFAULT_NETWORK.NAME.L1}
      </ChainLabelContainer>
    )
  }

  const L2ChainLabel = () => {
    return (
      <ChainLabelContainer variant="body2">
        <L2Icon selected />
        {networkName['l2'] || DEFAULT_NETWORK.NAME.L2}
      </ChainLabelContainer>
    )
  }
  const config: DirectionType = {
    from: toL2 ? <L1ChainLabel /> : <L2ChainLabel />,
    to: toL2 ? <L2ChainLabel /> : <L1ChainLabel />,
  }

  const selectedDirection = config[direction as keyof DirectionType]

  return direction ? selectedDirection : config.from
}
