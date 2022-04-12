import "./index.scss";

import {ApolloClient, ApolloProvider, InMemoryCache} from "@apollo/client";
import {DAppProvider, DEFAULT_SUPPORTED_CHAINS} from "@usedapp/core";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import {getChainConfig} from "./constants/network.constants";

const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: "https://api.thegraph.com/subgraphs/name/paulrberg/create-eth-app", // TODO
});

ReactDOM.render(
  <React.StrictMode>
    <DAppProvider config={getChainConfig()}>
      <ApolloProvider client={client}>
        <App/>
      </ApolloProvider>
    </DAppProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);
