import React, { FC, useEffect } from 'react'

import { updateToken } from 'actions/bridgeAction'
import { fetchBalances } from 'actions/networkAction'
import { closeModal } from 'actions/uiAction'
import Modal from 'components/modal/Modal'
import { isEqual } from 'util/lodash'

import { useDispatch, useSelector } from 'react-redux'
import {
  selectlayer1Balance,
  selectlayer2Balance,
  selectLayer,
} from 'selectors'
import { logAmount } from 'util/amountConvert'
import { getCoinImage } from 'util/coinImage'
import {
  TokenPickerModalContainer,
  TokenPickerList,
  TokenListItem,
  TokenSymbol,
  TokenLabel,
  TokenBalance,
} from './styles'
import { LAYER } from 'util/constant'

// the L2 token which can not be exited so exclude from dropdown in case of L2
const NON_EXITABLE_TOKEN = [
  'OLO',
  'xBOBA',
  'WAGMIv0',
  'WAGMIv1',
  'WAGMIv2',
  'WAGMIv2-Oolong',
]

interface TokenPickerModalProps {
  open: boolean
  tokenIndex: number
}

const TokenPickerModal: FC<TokenPickerModalProps> = ({ open, tokenIndex }) => {
  const layer = useSelector(selectLayer())
  const dispatch = useDispatch<any>()

  const l1Balance = useSelector(selectlayer1Balance, isEqual)
  const l2Balance = useSelector(selectlayer2Balance, isEqual)

  let balances = l1Balance

  if (layer === 'L2') {
    balances = l2Balance
  }

  useEffect(() => {
    dispatch(fetchBalances())
  }, [dispatch])

  const handleClose = () => {
    dispatch(closeModal('tokenPicker'))
  }

  const addToken = (token: any) => {
    dispatch(updateToken({ token, tokenIndex }))
    handleClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      minHeight="180px"
      title="Select Network"
      transparent={false}
    >
      <TokenPickerModalContainer>
        <TokenPickerList>
          {balances.length > 0
            ? balances
                .filter((token: any) => {
                  if (layer === LAYER.L2) {
                    return !(NON_EXITABLE_TOKEN.indexOf(token.symbol) > 0)
                  }
                  return true
                })
                .map((token: any) => {
                  const amount =
                    token.symbol === 'ETH'
                      ? Number(
                          logAmount(token.balance, token.decimals, 3)
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })
                      : Number(
                          logAmount(token.balance, token.decimals, 2)
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })

                  return (
                    <TokenListItem selected={token.symbol === 'ETH'}>
                      <TokenSymbol>
                        <img
                          src={getCoinImage(token.symbol)}
                          alt="logo"
                          width="24px"
                          height="24px"
                        />
                      </TokenSymbol>
                      <TokenLabel>{token.symbol}</TokenLabel>
                      <TokenBalance>{amount}</TokenBalance>
                    </TokenListItem>
                  )
                })
            : null}
        </TokenPickerList>
      </TokenPickerModalContainer>
    </Modal>
  )
}

export default React.memo(TokenPickerModal)
