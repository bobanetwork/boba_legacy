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

import { setNetwork } from 'actions/networkAction';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { CHAIN_ID_LIST, NetworkList } from 'util/network/network.util';

const useNetwork = () => {
  const [ searchParams ] = useSearchParams();
  const dispatch = useDispatch();

  useEffect(() => {
    const queryParams = Object.fromEntries([ ...searchParams ])
    const {
      chain,
      networkType,
      layer
    } = CHAIN_ID_LIST[ queryParams.chainId || 1 ]

    const [{name, icon,...rest}] = NetworkList[ networkType ].filter((n) => n.chain === chain);

    dispatch(setNetwork({
      networkType,
      name,
      network: chain,
      networkIcon: icon,
    }));

  }, [ searchParams, dispatch ]);

}


export default useNetwork;
