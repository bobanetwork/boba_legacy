import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Button } from 'antd';
import { WalletOutlined } from '@ant-design/icons';

import { updateNetworkInfo } from '../../redux/actions/networkAction'

import useInterval from '../../utils/useInterval'

import { selectNetworkInfo } from '../../redux/selector/networkSelector'

import './Footer.css'

function Footer() {

    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(updateNetworkInfo())
    }, [dispatch])

    useInterval(() => {
        dispatch(updateNetworkInfo())
    }, 15000)

    const networkInfo = useSelector(selectNetworkInfo)

    return (
        <div className='footerContainer'>
            <div className='footerGas'>{networkInfo.gasPrice} gwei</div>
            {networkInfo.blockNumber}
            <div className='footerDot'></div>
        </div>
    )
}

export default React.memo(Footer)