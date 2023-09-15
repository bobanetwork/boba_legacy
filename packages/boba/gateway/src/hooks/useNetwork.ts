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

import { setNetwork } from 'actions/networkAction'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveNetwork, selectActiveNetworkType } from 'selectors'
import { NetworkList } from 'util/network/network.util'

const useNetwork = () => {
  console.log('here')
  const dispatch = useDispatch<any>()
  const activeNetworkType = useSelector(selectActiveNetworkType())
  const activeNetwork = useSelector(selectActiveNetwork())

  useEffect(() => {
    const { name, icon, chainId } = (NetworkList as any)[
      activeNetworkType as any
    ].filter((n: any) => n.chain === activeNetwork)[0]

    dispatch(
      setNetwork({
        name,
        network: activeNetwork,
        networkIcon: icon,
        chainIds: chainId,
      })
    )
  }, [dispatch, activeNetworkType, activeNetwork])
}

export default useNetwork
