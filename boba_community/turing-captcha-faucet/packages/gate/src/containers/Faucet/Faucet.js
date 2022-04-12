import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Button } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { Radio } from 'antd';

import useInterval from '../../utils/useInterval'

import { getCAPTCHAImage } from '../../redux/actions/captchaAction'
import { selectWalletAccount } from '../../redux/selector/walletSelector'
import { selectCAPTCHAInfo } from '../../redux/selector/captchaSelector'

import './Faucet.css'
import networkService from '../../network/networkService';
import { openAlert, openError } from '../../redux/actions/uiAction';

function Faucet() {

    const dispatch = useDispatch()

    const [value, setValue] = useState(1)
    const [key, setKey] = useState('')
    const [loading, setLoading] = useState(false)

    const account = useSelector(selectWalletAccount)
    const captchaInfo = useSelector(selectCAPTCHAInfo)

    useInterval(() => {
        dispatch(getCAPTCHAImage())
    }, 300000)

    const onChange = e => {
        setValue(e.target.value);
    };

    const sendRequest = async () => {
        setLoading(true)
        const res = await networkService.verifyCAPTCHAImage(value, captchaInfo.uuid, key)
        if (res.error) {
            let error = res.error.data.message
            if (error === 'execution reverted: Invalid request') {
                error = 'You reached the request limit. Please come back again after 24 hours!'
            }
            dispatch(openError(error))
            dispatch(getCAPTCHAImage())
            setKey('')
        } else {
            dispatch(openAlert(`${value === 1 ? '10 test BOBA' : '0.1 test ETH'} was sent to your wallet`))
            dispatch(getCAPTCHAImage())
            setKey('')
        }
        setLoading(false)
    }

    const buttonDisabled = key === '' || key.length === 0 || loading || !account

    return (
        <div className='faucetContainer'>
            <div className='title'>Request testnet BOBA</div>
            <div className='middleText'>Get testnet BOBA and ETH for an account
                on Boba Rinkeby testnets so you can
                create and test your own smart contract.
            </div>
            <div className='smallText'>Testnet account adddress</div>
            <Input placeholder='' className='faucetInput' value={account ? account: 'Unknown'} disabled/>
            <div className='smallText' style={{marginTop: 10}}>Request type</div>
            <Radio.Group onChange={onChange} value={value}>
                <Radio value={1}
                    className={value === 1 ? 'faucetSelect': 'faucetUnselect'}
                >
                    10 test BOBA
                </Radio>
                <Radio value={2}
                    className={value === 2 ? 'faucetSelect': 'faucetUnselect'}
                >
                    0.1 test ETH
                </Radio>
            </Radio.Group>
            <div className='smallText'>CAPTCHA</div>
            {captchaInfo.loading ?
                <SyncOutlined className='faucetLoading' spin/>:
                <img src={`data:image/png;base64,${captchaInfo.imageBase64}`} className="captchaImage"/>
            }
            <Input placeholder='Enter the characters you see' className='captchaInput' onChange={e => setKey(e.target.value)}/>
            <Button
                className={buttonDisabled? 'disableRequestButton': 'requestButton'}
                disabled={buttonDisabled}
                onClick={()=>{sendRequest()}}
                icon={loading ? <SyncOutlined spin/>:<></>}
            >
                {loading? 'Pending...': 'Send Request'}
            </Button>
            <div className='smallText' style={{marginTop: 20}}>Your result will be hashed and compared off-chain through Turing. Email us at&nbsp;<a href={"mailto:contact@enya.ai"}> contact@enya.ai </a>&nbsp;if there are questions or issues about Turing, thanks!</div>
        </div>
    )
}

export default React.memo(Faucet)