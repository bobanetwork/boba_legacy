import {Contract} from "@ethersproject/contracts";
import {
  useContractFunction,
  useEthers,
} from "@usedapp/core";
import React from "react";
import { utils } from 'ethers'
import {Body, Button, Container, Header, HeaderCol, Image, Link} from "./components";
import logo from "./assets/logo.min.jpg";

import {addresses, abis} from "@turing/contracts";
import {WalletButton} from "./components/WalletButton";
import {L2GovernanceERC20, TuringHelperFactory} from "@turing/contracts/gen/types";
import {TuringIntro} from "./components/TuringIntro";

function App() {
  /*
  TODO: Use non-blocking library for max UX
  const {notifications} = useNotifications()
  {notifications.map((notification) => {

  })}*/

  const contractTuringFactory: TuringHelperFactory = new Contract(addresses.TuringHelperFactory, new utils.Interface(abis.turingHelperFactory)) as TuringHelperFactory;
  const contractBobaToken: L2GovernanceERC20 = new Contract(addresses.BobaToken, new utils.Interface(abis.bobaToken)) as L2GovernanceERC20

  // TODO: Gather via views!
  const permittedCallers = ["0x3f8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C"]
  const amountBobaToDeposit = '100' // TODO: WEI!, 0.01 per call, ask for how many calls you want to prepay

  const {state: deployState, send: deployTuringHelper} = useContractFunction(contractTuringFactory, 'deployMinimal', {transactionName: 'DeployTuringHelper'})
  const {state: approveState, send: approveBoba} = useContractFunction(contractBobaToken, 'approve', {transactionName: 'approveBoba'})

  const {account} = useEthers()

  /*const {loading, error: subgraphQueryError, data} = useQuery(GET_TRANSFERS);

  useEffect(() => {
    if (subgraphQueryError) {
      console.error("Error while querying subgraph:", subgraphQueryError.message);
      return;
    }
    if (!loading && data && data.transfers) {
      console.log({transfers: data.transfers});
    }
  }, [loading, subgraphQueryError, data]);*/

  return (
    <Container>
      <Header>
        <HeaderCol>
          <Image src={logo} alt="boba-logo" width={150} height={150 * 0.666} style={{marginLeft: 12}}/>
        </HeaderCol>
        <HeaderCol style={{textAlign: 'right'}}>
          <WalletButton/>
        </HeaderCol>
      </Header>
      <Body>


        <TuringIntro />
        <Button disabled={account === undefined} onClick={async () => {
          // TODO: Add loading status
          await approveBoba(contractTuringFactory.address, amountBobaToDeposit);
        }}>Approve Boba</Button>

        <Button disabled={account === undefined} onClick={async () => {
          await deployTuringHelper(permittedCallers, 1)
        }}>Deploy TuringHelper</Button>

        <p>
          Approve state: {approveState.status}
        </p>
        <p>
          Deploy state: {deployState.status}
        </p>
        <Link href="https://usedapp.io/">Learn useDapp</Link>
        <Link href="https://thegraph.com/docs/quick-start">Learn The Graph</Link>
      </Body>
    </Container>
  );
}

export default App;
