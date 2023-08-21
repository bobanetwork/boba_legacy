import React, { ElementType, FC } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  INetwork,
  L1_ICONS,
  L2_ICONS,
  NetworkList as NetworkLists,
} from 'util/network/network.util'

import {
  selectActiveNetwork,
  selectActiveNetworkType,
  selectModalState,
  selectLayer,
} from 'selectors'

import { setNetwork } from 'actions/networkAction'

import {
  NetworkPickerList,
  NetworkItem,
  NetworkIcon,
  NetworkLabel,
} from './styles'

interface NetworkListProps {
  close?: () => void
}

export const NetworkList: FC<NetworkListProps> = ({ close = () => {} }) => {
  const dispatch = useDispatch<any>()
  const networkType = useSelector(selectActiveNetworkType())
  const activeNetwork = useSelector(selectActiveNetwork())
  const selectionLayer = useSelector(selectModalState('selectionLayer'))
  const layer = useSelector<any>(selectLayer())

  const l1Icon = L1_ICONS as Record<string, ElementType>
  const l2Icon = L2_ICONS as Record<string, ElementType>

  const networks = (NetworkLists as Record<string, any>)[networkType]
  const currentLayer = selectionLayer || (layer as string).toLowerCase()
  const onChainChange = (chainDetail: any) => {
    dispatch(
      setNetwork({
        network: chainDetail.chain,
        name: chainDetail.name,
        networkIcon: chainDetail.icon,
        networkType,
      })
    )
    close()
  }

  return (
    <NetworkPickerList>
      {networks.map((chainDetail: INetwork) => {
        const CurrentIcon =
          selectionLayer === 'l1'
            ? l1Icon[chainDetail.icon]
            : l2Icon[chainDetail.icon]

        return (
          <NetworkItem
            selected={chainDetail.chain === activeNetwork}
            key={chainDetail.label}
            onClick={() => onChainChange(chainDetail)}
          >
            <NetworkIcon>
              <CurrentIcon selected />
            </NetworkIcon>
            <NetworkLabel>{chainDetail.name[selectionLayer]}</NetworkLabel>
          </NetworkItem>
        )
      })}
    </NetworkPickerList>
  )
}
