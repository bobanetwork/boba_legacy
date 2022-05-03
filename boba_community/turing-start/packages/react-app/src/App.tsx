import React, { useEffect, useState } from "react";
import { Body, Container, H1, Header, HeaderCol, Image, P } from "./components";
import logo from "./assets/logo.min.jpg";

import {WalletButton} from "./components/WalletButton";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from "react-toastify";
import HorizontalLinearStepper from "./components/HorizontalLinearStepper";
import { Contract } from "@ethersproject/contracts";
import { L2GovernanceERC20 } from "@turing/contracts/gen/types";
import { abis, addresses } from "@turing/contracts";
import { utils } from "ethers";

function App() {
  const contractBobaToken: L2GovernanceERC20 = new Contract(addresses.BobaToken, new utils.Interface(abis.bobaToken)) as L2GovernanceERC20;

  return (
    <Container style={{backgroundColor: 'black'}}>
      <Header>
        <HeaderCol>
          <Image src={logo} alt="boba-logo" width={150} height={150 * 0.666} style={{marginLeft: 12}}/>
        </HeaderCol>
        <HeaderCol style={{textAlign: 'right'}}>
          <WalletButton contractBobaToken={contractBobaToken}/>
        </HeaderCol>
      </Header>
      <Body style={{width: '100%', textAlign: 'center', marginRight: 'auto', marginLeft: 'auto', backgroundColor: 'black'}}>
        <>
          <H1>Use Turing with ease</H1>
          <P>Simply follow this guide to start using Turing in your project. Feel free to consult the docs to deploy without this DApp.</P>
          <HorizontalLinearStepper
            contractBobaToken={contractBobaToken} />
        </>
      </Body>
      <ToastContainer position="top-right"/>
    </Container>
  );
}


export default App;
