import React from 'react';
import styled from 'styled-components';

import {getCoinImage} from 'util/coinImage';
import { getWalletType } from 'actions/networkAction';
import MetamaskLogo from 'images/metamask.svg';

import {TEXT, SMALL} from 'components/global/text';
import {ROW, COLUMN} from 'components/global/containers';
import { addTokenToWallet } from "util/network/addWalletToken"

const Icon = styled.img`
    display:flex;
    width:35px;
    height:35px;
    margin-right:10px;
`;

const IconLabelContainer = styled(ROW)`
    .metamask {
        opacity:0;
        transition: opacity 0.3s ease;
    }

    &:hover {
        .metamask {
            opacity:1;
        }
    }

`;

export const IconLabel = (props) => {
    const walletType = getWalletType();
    const {symbol , name } = props.token
    const logo = getCoinImage(symbol);

    const handleAddWallet = async (e) => {
        console.log('im here');
        e.stopPropagation()
    
        await addTokenToWallet(props.token)
      }
    return (
        <IconLabelContainer>
            <COLUMN>
                <ROW>
                    <div>                
                        <Icon src={logo} alt="logo"/>
                    </div>
                    <div>
                        <TEXT>{symbol}</TEXT>
                        <SMALL>{name}</SMALL>
                    </div>
                </ROW>
            </COLUMN>
            {walletType && 
            <COLUMN onClick={(e)=> handleAddWallet(e)} className="metamask" style={{marginLeft:'auto'}}>
                <img src={MetamaskLogo} alt={"Add to Metamask"} width={20} height={20} />
            </COLUMN>
            }
        </IconLabelContainer>
    )
}