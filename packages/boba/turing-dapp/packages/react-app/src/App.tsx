import React from "react";
import {Body, Container, Header, HeaderCol, Image, Link} from "./components";
import logo from "./assets/logo.min.jpg";

import {WalletButton} from "./components/WalletButton";
import {TuringIntro} from "./components/TuringIntro";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from "react-toastify";

function App() {
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
      <Body style={{width: '95%', textAlign: 'center', marginRight: 'auto', marginLeft: 'auto'}}>
        <TuringIntro />
      </Body>
      <ToastContainer position="top-right"/>
    </Container>
  );
}

export default App;
