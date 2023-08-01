import React from 'react';

import { DISABLE_VE_DAO, ROUTES_PATH } from "util/constant";

import Bridging from 'containers/Bridging';
import Vote from 'containers/VoteAndDao/Vote/Vote';
import BobaScope from 'containers/bobaScope/BobaScope';
import OldDao from 'containers/dao/OldDao';
import DevTools from 'containers/devtools/DevTools';
import EarnWrapper from 'containers/earn/EarnWrapper';
import Home from "containers/home/Home";
import SaveWrapper from 'containers/save/SaveWrapper';
import Lock from 'containers/veboba/Lock';
import { Navigate } from 'react-router-dom';
import History from 'containers/history/History';

export const COMMON_ROUTES = [
  {
    path: "*",
    element: <Navigate to="/" />,
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
      },
      {
        path: ROUTES_PATH.LOCK,
        element: <Lock />,
        key: 'DAO',
        disable: !!Number(DISABLE_VE_DAO),
      },
      {
        path: ROUTES_PATH.VOTE_DAO,
        element: <Vote />,
        key: 'DAO',
        disable: !!Number(DISABLE_VE_DAO),
      },
    ]
  }
]
