import React from 'react';
import { Navigate } from 'react-router-dom';

import { ROUTES_PATH } from "util/constant";

import Bridging from 'containers/Bridging';
import BobaScope from 'containers/bobaScope/BobaScope';
import OldDao from 'containers/dao/OldDao';
import DevTools from 'containers/devtools/DevTools';
import EarnWrapper from 'containers/earn/EarnWrapper';
import Home from "containers/home/Home";
import SaveWrapper from 'containers/save/SaveWrapper';

import History from 'containers/history/History';

export const COMMON_ROUTES = [
  {
    path: "*",
    element: <Navigate to={ROUTES_PATH.BRIDGE} />,
    key: '',
  },
  {
    path: ROUTES_PATH.BOBASCOPE,
    element: <BobaScope />,
    key: 'bobascope',
  },
  {
    path: ROUTES_PATH.DEV_TOOLS,
    element: <DevTools />,
    key: 'Devtool',
  },
]

export const ROUTE_LIST = [
  {
    path: '/',
    element: <Home />,
    children: [
      {
        path: ROUTES_PATH.BRIDGE,
        element: <Bridging />,
        key: 'Bridge',
      },
      {
        path: ROUTES_PATH.HISTORY,
        element: <History />,
        key: 'History',
      },
      {
        path: ROUTES_PATH.EARN,
        element: <EarnWrapper />,
        key: 'Earn',
      },
      {
        path: ROUTES_PATH.STAKE,
        element: <SaveWrapper />,
        key: 'Stake',
      },
      {
        path: ROUTES_PATH.DAO,
        element: <OldDao />,
        key: 'DAO',
      }
    ]
  }
]
