import React, { FC, useEffect, useState } from 'react'
import { updateToken } from 'actions/bridgeAction'
import { fetchBalances } from 'actions/networkAction'
import { closeModal } from 'actions/uiAction'
import Modal from 'components/modal/Modal'
import { isEqual } from 'util/lodash'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectLayer,
  selectTokenToBridge,
  selectlayer1Balance,
  selectlayer2Balance,
} from 'selectors'
import { getCoinImage } from 'util/coinImage'
import { LAYER } from 'util/constant'
import {
  ActionLabel,
  ListLabel,
  TokenBalance,
  TokenLabel,
  TokenListItem,
  TokenPickerAction,
  TokenPickerList,
  TokenPickerModalContainer,
  TokenSearchContainer,
  TokenSearchInput,
  TokenSymbol,
} from './styles'
import { formatTokenAmount } from 'util/common'

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
  const tokenToBridge = useSelector(selectTokenToBridge())

  const [isMyToken, setIsMyToken] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

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

  const onTokenSelect = (token: any) => {
    dispatch(updateToken({ token, tokenIndex: 0 }))
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
        <TokenSearchContainer>
          <TokenSearchInput
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search token name"
          />
        </TokenSearchContainer>
        <TokenPickerAction>
          <ActionLabel
            selected={!isMyToken}
            onClick={() => setIsMyToken(false)}
          >
            All
          </ActionLabel>
          <ActionLabel selected={isMyToken} onClick={() => setIsMyToken(true)}>
            My Tokens
          </ActionLabel>
        </TokenPickerAction>
        <ListLabel> Token Names </ListLabel>
        <TokenPickerList>
          {balances.length > 0
            ? balances
                .filter((token: any, index: number) => {
                  if (layer === LAYER.L2) {
                    return !(NON_EXITABLE_TOKEN.indexOf(token.symbol) > 0)
                  }
                  return true
                })
                .map((token: any) => {
                  const amount = formatTokenAmount(token)

                  if (isMyToken && Number(amount) <= 0) {
                    return null
                  }

                  if (
                    searchTerm &&
                    !token.symbol.includes(searchTerm.toUpperCase())
                  ) {
                    return null
                  }

                  return (
                    <TokenListItem
                      key={token.symbol}
                      selected={token.symbol === tokenToBridge?.symbol}
                      onClick={() =>
                        onTokenSelect({
                          ...token,
                          amount,
                        })
                      }
                    >
                      <TokenSymbol>
                        <img
                          src={getCoinImage(token.symbol)}
                          alt={`${token.symbol} logo`}
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
