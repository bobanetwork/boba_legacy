import React from "react";
import { connect } from "react-redux";
import { isEqual } from "lodash";
import Copy from "components/copy/Copy";
import { Md5 } from "ts-md5/dist/md5";

import ListNFT from "components/listNFT/listNFT";
import * as S from "./Monster.styles";
import * as G from "containers/Global.styles";

import { Box, Typography, Grid, Input } from "@mui/material";

import PageTitle from "components/pageTitle/PageTitle";
import networkService from "services/networkService";
import BobaGlassIcon from "components/icons/BobaGlassIcon";
import Connect from "containers/connect/Connect";
import Button from "../../components/button/Button";
import { getETHMetaTransaction, getTestnetETHAuthenticatedMetaTransaction } from "../../actions/setupAction";
import { openAlert } from "../../actions/uiAction";

class Monster extends React.Component {

  constructor(props) {

    super(props);

    const {
      list,
      monsterNumber,
      monsterInfo
    } = this.props.nft

    const {
      accountEnabled,
      netLayer,
      walletAddress
    } = this.props.setup

    this.state = {
      list,
      contractAddress: "",
      tokenID: "",
      loading: this.props.loading["NFT/ADD"],
      accountEnabled,
      netLayer,
      monsterNumber,
      monsterInfo,
      walletAddress,
      bobaTag: "",
      tweetUrl: "",
      isClaimFaucetLoading: false,
      faucetErrorMsg: null,
    };

  }

  componentDidUpdate(prevState) {

    const {
      list,
      monsterNumber,
      monsterInfo
    } = this.props.nft

    const {
      accountEnabled,
      netLayer,
      walletAddress
    } = this.props.setup

    if (!isEqual(prevState.nft.list, list)) {
      this.setState({ list })
    }

    if (!isEqual(prevState.nft.monsterNumber, monsterNumber)) {
      this.setState({ monsterNumber })
    }

    if (!isEqual(prevState.nft.monsterInfo, monsterInfo)) {
      this.setState({ monsterInfo })
    }

    if (!isEqual(prevState.loading["NFT/ADD"], this.props.loading["NFT/ADD"])) {
      this.setState({ loading: this.props.loading["NFT/ADD"] });
      if (this.props.loading["NFT/ADD"]) {
        this.setState({ contractAddress: "" })
      }
    }

    if (!isEqual(prevState.setup.accountEnabled, accountEnabled)) {
      this.setState({ accountEnabled })
    }

    if (!isEqual(prevState.setup.walletAddress, walletAddress)) {
      this.setState({ walletAddress });
      this.setState({ bobaTag: Md5.hashStr(walletAddress.substring(2)) })
    }

    if (!isEqual(prevState.setup.netLayer, netLayer)) {
      this.setState({ netLayer })
    }

  }

  handleInputAddress = event => {
    this.setState({ contractAddress: event.target.value });
  };

  handleInputID = event => {
    this.setState({ tokenID: event.target.value });
  };

  async addNFT() {
    await networkService.addNFT(this.state.contractAddress, this.state.tokenID);
  }

  async claimAuthenticatedFaucetTokens() {
    try {
      this.setState({...this.state, isClaimFaucetLoading: true})
      const tweetId = this.state.tweetUrl?.match(/twitter\.com\/.*\/status\/(\d+)/)[1]
      console.log("tweetId:",tweetId)
      const {dispatch} = this.props
      const res = await dispatch(getTestnetETHAuthenticatedMetaTransaction(tweetId))
      if (res) dispatch(openAlert('Faucet request submitted'))
    } catch (err) {
      let error = err.message.match(/execution reverted: (.*)\\+"}}/)
      if (error) {
        error = error[1]
      } else {
        error = err?.message ?? err;
      }
      console.error(error);
      this.setState({...this.state, faucetErrorMsg: error})

    } finally {
      this.setState({...this.state, isClaimFaucetLoading: false})
    }
  }

  render() {

    const {
      list,
      netLayer,
      monsterInfo,
      accountEnabled,
      bobaTag,
      tweetUrl
    } = this.state

    console.log("tweetUrl:",tweetUrl)

    let BT = "";
    if (bobaTag)
      BT = "BOBA" + bobaTag.substring(0, 9).toUpperCase();

    let tokenIDverified = null;

    //figure out which monster type we are dealing with
    let monsterType = "Monster";

    // since it uses FIND, this code will only find one of your monsters
    // FIX ME to show the 'top' monster for this wallet if you have several
    // in which case you are lucky.
    if (monsterInfo.length > 0) {

      tokenIDverified = monsterInfo.find(e => e.tokenID);

      if (typeof (tokenIDverified) !== "undefined") {
        tokenIDverified = Number(monsterInfo.find(e => e.tokenID).tokenID);
      } else {
        tokenIDverified = null;
      }

      const type = monsterInfo.find(e => e.monsterType).monsterType;

      if (type === "crowned") {
        monsterType = "Crowned Monster";
      } else if (type === "wizard") {
        monsterType = "Wizard Monster";
      } else if (type === "crowned wizard") {
        monsterType = "Crowned Wizard";
      }
    }

    return (

      <S.StakePageContainer>

        <PageTitle title={"MonsterVerse"} />

        <Connect
          userPrompt={"Please connect to Boba"}
          accountEnabled={accountEnabled}
          connectToBoba={true}
          layer={netLayer}
        />

        <Grid container spacing={1} sx={{ my: 2 }}>

          <S.NFTPageContainer>
            <S.NFTActionContent>
              <S.NFTFormContent>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                    <BobaGlassIcon />
                    <Typography variant="body1">
                      MonsterVerse
                    </Typography>
                  </Box>
                  <G.DividerLine />
                  {tokenIDverified &&
                    <Typography variant="body1">
                      <br />Welcome, {monsterType} {tokenIDverified}
                    </Typography>
                  }
                  {accountEnabled &&
                    <Box style={{ display: "inline-block" }}>
                      <Typography variant="body1">
                        Your Boba Bubble:{" "}
                        <span style={{ opacity: 0.65 }}>{BT} <Copy value={BT} light={false} /></span>
                      </Typography>
                    </Box>
                  }
                  {tokenIDverified === null &&
                    <Typography variant="body3" sx={{ opacity: 0.65 }}>
                      <br />You have one or more Turing Monsters, but you have not added them
                      to your NFT page (<strong>{"Wallet > NFT > Add NFT"}</strong>).
                      Please add them to join the MonsterVerse.
                    </Typography>
                  }
                </Box>
                {Object.keys(list).map((v, i) => {
                  const key_UUID = `nft_` + i;
                  if (tokenIDverified === Number(list[v].tokenID)) {
                    return (
                      <ListNFT
                        key={key_UUID}
                        name={list[v].name}
                        symbol={list[v].symbol}
                        address={list[v].address}
                        UUID={list[v].UUID}
                        URL={list[v].url}
                        meta={list[v].meta}
                        tokenID={list[v].tokenID}
                        small={"true"}
                      />);
                  } else {
                    return null;
                  }
                })
                }
              </S.NFTFormContent>
            </S.NFTActionContent>
            <S.NFTListContainer>
              <Box sx={{
                display: "flex",
                flexDirection: "column",
                paddingTop: "10px"
              }}>
                <Typography variant="body2" sx={{ opacity: 0.95, margin: "0" }}>
                  Meetups
                </Typography>

                <Typography variant="body3" sx={{ opacity: 0.65, marginBottom: "16px" }}>
                  Turing monster holders will be invited to meetups in different regions, such as Amsterdam, Dubai, and
                  Hong Kong.
                  If you would like to host a meetup, or would like to propose one in your city, let us know - a signup
                  system will
                  go live later in May.
                </Typography>

                <Typography variant="body2" sx={{ opacity: 0.95 }}>
                  First look: Experimental Features
                </Typography>

                <Typography variant="body3" sx={{ opacity: 0.65, marginBottom: "16px" }}>
                  Here is where we will showcase new features and projects, for you to see first.
                  Check out the top right of the screen to test the new dual fee system. You can toggle
                  back and forth between ETH and BOBA. This is a beta feature which is currently being tested,
                  so it might not work smoothly in all circumstances. Any feedback welcome - looking forward to
                  MUIs!!! Haha.
                </Typography>

                <Typography variant="body2" sx={{ opacity: 0.95 }}>
                  Boba Bubble
                </Typography>

                <Typography variant="body3" sx={{ opacity: 0.65, marginBottom: "10px" }}>
                  You can use your Boba Bubble to obtain developer tokens on the Boba testnet, and
                  also, to support content creators, journalists, artists, and developers. When they use their
                  Boba Bubble on social media and in their art, you will be able to send BOBA and ETH to
                  their Boba wallet. The system is powered by Turing, which does all
                  the heavy lifting in the background.
                </Typography>

                <Typography variant='body2' sx={{ opacity: 0.95 }}>
                  Developer Twitter/Turing test token fountain
                </Typography>
                
                <Typography variant="body3" sx={{ opacity: 0.65, marginBottom: "10px" }}>
                  To receive testnet BOBA and ETH for developing on Boba rinkeby, tweet your Boba Bubble and 
                  paste the tweet link here. You can get the link on Twitter by tapping the share icon, then tapping 
                  "Share Tweet via", and finally selecting "Copy link to Tweet". 
                  Your link should look something like this: https://twitter.com/name/status/1234567
                </Typography>

                <Input 
                  value={tweetUrl} 
                  onChange={(e) => this.setState({
                      ...this.state, 
                      tweetUrl: e?.target?.value.split('?')[0] //remove the superfluous stuff after the "?"
                    })
                  } 
                />

                <Button
                  type="primary"
                  variant="contained"
                  style={{ marginTop: "10px", marginBottom: "18px" }}
                  disabled={!this.state.tweetUrl || !this.state.tweetUrl?.includes('http')}
                  loading={this.state.isClaimFaucetLoading}
                  onClick={async (e) => {await this.claimAuthenticatedFaucetTokens()}}
                  size="small">
                  Authenticated Faucet
                </Button>
                {this.state.faucetErrorMsg ? <Typography style={{color: 'red'}}>{this.state.faucetErrorMsg}</Typography> : null}

              </Box>
            </S.NFTListContainer>
          </S.NFTPageContainer>
        </Grid>
      </S.StakePageContainer>

    );
  }
}

const mapStateToProps = state => ({
  nft: state.nft,
  loading: state.loading,
  setup: state.setup
});

export default connect(mapStateToProps)(Monster);
