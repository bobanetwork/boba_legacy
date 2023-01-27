import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { Radio } from "antd";

import useInterval from "../../utils/useInterval";

import { getCAPTCHAImage } from "../../redux/actions/captchaAction";
import { selectWalletAccount, selectWalletBalanceInWei } from "../../redux/selector/walletSelector";
import { selectCAPTCHAInfo } from "../../redux/selector/captchaSelector";

import "./Faucet.css";
import networkService from "../../network/networkService";
import { openAlert, openError } from "../../redux/actions/uiAction";

function Faucet() {

  const dispatch = useDispatch();

  const [value, setValue] = useState(1);
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);

  const account = useSelector(selectWalletAccount);
  const captchaInfo = useSelector(selectCAPTCHAInfo);
  const accountBalance = useSelector(selectWalletBalanceInWei);

  useInterval(() => {
    dispatch(getCAPTCHAImage());
  }, 300000);

  const onChange = e => {
    setValue(e.target.value);
  };

  const sendRequest = async () => {
    setLoading(true);
    const res = await networkService.verifyCAPTCHAImage(value, captchaInfo.uuid, key);
    if (res.error) {
      let error = res?.error?.data?.message
      console.log("error:", error)
      if (error === "execution reverted: Invalid request") {
        error = "You reached the request limit. Please come back again after 24 hours!"
        dispatch(openAlert(error))
      } else if (error === "execution reverted: Invalid key and UUID"){
        error = "You failed the CAPTCHA test. Are you human? Please try again"
        dispatch(openError(error))
      } else if (error === "execution reverted: TURING: Server error"){
        error = "Servers are starting from cold boot. Please try again in 15 seconds"
        dispatch(openAlert(error))
      }
      dispatch(getCAPTCHAImage())
      setKey("")
    } else {
      dispatch(openAlert(`${value === 1 ? "10 test BOBA" : "0.1 test ETH"} was sent to your wallet`))
      dispatch(getCAPTCHAImage())
      setKey("")
    }
    setLoading(false)
  };

  const hasFunds = account ? accountBalance > 500000000000000 : false;
  const buttonDisabled = key === "" || key.length === 0 || loading || !account || !hasFunds;

  return (
    <div className="faucetContainer">
      <div className="title">Request testnet BOBA or ETH</div>
      <div className="middleText">Get testnet BOBA and ETH for an account
        on Boba Rinkeby. You can use these testnet tokens to
        create and test your own smart contracts on Boba Rinkeby.
      </div>
      <div className="middleText">
        You are limited to one BOBA request and one ETH request every 24 hours, and
        you must have some Rinkeby ETH in your account to use this faucet.
        If you do not have any Rinkeby ETH, you can get some from{" "}
        <a target="_blank" href="https://faucets.chain.link/rinkeby">Chainlink Faucet</a>,{" "}
        <a target="_blank" href="https://faucet.rinkeby.io">Rinkeby Authenticated Faucet</a>,{" "}or
        {" "}<a target="_blank" href="https://rinkebyfaucet.com">RINKEBY FAUCET</a>.
      </div>
      <div className="smallText">Testnet account adddress</div>
      <Input placeholder="" className="faucetInput" value={account ? account : "Wallet not connected"} disabled />
      <div className="smallText" style={{ marginTop: 10 }}>Request type</div>
      <Radio.Group onChange={onChange} value={value}>
        <Radio value={1}
               className={value === 1 ? "faucetSelect" : "faucetUnselect"}
        >
          10 test BOBA
        </Radio>
        <Radio value={2}
               className={value === 2 ? "faucetSelect" : "faucetUnselect"}
        >
          0.1 test ETH
        </Radio>
      </Radio.Group>
      <div className="smallText">CAPTCHA</div>
      {captchaInfo.loading ?
        <SyncOutlined className="faucetLoading" spin /> :
        <img src={`data:image/png;base64,${captchaInfo.imageBase64}`} className="captchaImage" />
      }
      <Input placeholder="Enter the characters you see" className="captchaInput"
             onChange={e => setKey(e.target.value)} onKeyUp={e => {
               if (e.key === 'Enter') {
                  sendRequest()
               }
      }} />
      <Button
        className={buttonDisabled ? "disableRequestButton" : "requestButton"}
        disabled={buttonDisabled}
        onClick={() => {
          sendRequest();
        }}
        icon={loading ? <SyncOutlined spin /> : <></>}
      >
        {loading ? "Pending..." :
          hasFunds ? "Send Request" : "Not enough funds"}
      </Button>
      <div className="smallText" style={{ marginTop: 20 }}>{account && !hasFunds
          ? <span style={{color: 'red'}}>
            Please bridge some funds from L1 Rinkeby to L2 Boba Rinkeby via our&nbsp;
            <a href="https://gateway.rinkeby.boba.network/" title="Gateway - Bridge ETH" target="_blank">Gateway</a>.</span>
        : 'Your result will be hashed and compared off-chain through Turing.'}
      </div>
    </div>
  );
}

export default React.memo(Faucet);
