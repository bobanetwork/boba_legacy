import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Button } from 'antd';
import { WalletOutlined } from '@ant-design/icons';

import { connectWallet } from '../../redux/actions/walletAction'

import {
    selectWalletBalance,
    selectWalletConnectStatus,
    selectWalletAccount,
} from '../../redux/selector/walletSelector'

import bobaLogo from '../../image/boba-logo.svg'
import boba from '../../image/boba-token.svg';

import './Header.css'

function Header() {
    const dispatch = useDispatch()
    const walletConnected = useSelector(selectWalletConnectStatus)
    const balance = useSelector(selectWalletBalance)
    const account = useSelector(selectWalletAccount)

    function startConnection() {
        dispatch(connectWallet())
    }

    useEffect(() => {
        const wallectConnectionStatus = localStorage.getItem('wallectConnectionStatus')
        if (wallectConnectionStatus === 'connected') {
            dispatch(connectWallet())
        }
    }, [dispatch])

    return (
        <div className='headerContainer'>
            <img src={bobaLogo} className="headerImage"></img>
            <div className='rightContainer'>
                { walletConnected ?
                    <img src={boba} className="bobaImage"></img>: <></>
                }
                <Button
                    type="primary" shape="round" size="large"
                    icon={<WalletOutlined />}
                    onClick={startConnection}
                    disabled={walletConnected}
                    className={walletConnected ? 'headerButtonConnect':'headerButton'}
                >
                    {walletConnected ? account.slice(0, 20): 'Connect to Boba Rinkeby'}
                </Button>
            </div>
        </div>
    )
}

export default React.memo(Header)