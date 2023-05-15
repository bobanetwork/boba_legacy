import React, { useEffect, useState } from 'react'
import { Column, Row } from 'components/global/containers'
import Banxa from 'images/banxa.png'
import { DropDown } from 'components'
import { getStatics, PaymentMethod, createOrder } from 'util/banxa'
import { useDispatch, useSelector } from 'react-redux'
import Button from 'components/button/Button.js'

import { selectAccountEnabled } from 'selectors'

import {
  BanxaContainer,
  Label,
  LabelText,
  Input,
  SwapContainer,
  Fees,
  Option,
  Check,
  OptionContainer,
  ButtonContainer,
  IconMethod,
  OptionWrapper,
} from './styles'

const BanxaBridge = () => {
  const accountEnabled = useSelector(selectAccountEnabled())
  const dispatch = useDispatch()

  const [amount, setAmount] = useState('')
  const [fiatList, setFiatList] = useState([])
  const [currencyList, setCurrencyList] = useState([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [currency, setCurrency] = useState<string>('USD')
  const [token, setToken] = useState<string>('ETH')

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value)
  }

  const handleSelecPaymentMethod = (id: string) => {
    setSelectedPaymentMethod(id)
  }

  const handleCreateOrder = () => {
    const data = {
      account_reference: '',
      source: currency,
      source_amount: amount,
      target: token,
      wallet_address: '',
      payment_method_id: selectedPaymentMethod,
    }
    console.log(data)
    if (selectedPaymentMethod) {
      createOrder(data)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const data = await getStatics()
      const { fiats, coins, paymentMethods } = data
      setFiatList(fiats)
      setCurrencyList(coins)
      setPaymentMethod(paymentMethods)
    }

    fetchData()
  }, [])

  const filteredPaymentMethod = () => {
    return paymentMethod?.filter(
      (x) =>
        x?.supported_fiat?.includes(currency) &&
        x?.supported_coin?.includes(token)
    )
  }

  return (
    <BanxaContainer>
      <Column>Enter amount</Column>
      <SwapContainer>
        <Label style={{ zIndex: 2 }}>
          <Row>
            <LabelText>You’ll pay</LabelText>
          </Row>
          <Row>
            <Input
              placeholder="00.0"
              value={amount}
              onChange={handleInputChange}
            />
            <DropDown
              onOptionSelect={(selected: string) => setCurrency(selected)}
              options={fiatList}
            />
          </Row>
        </Label>
        <Label style={{ zIndex: 1 }}>
          <Row>
            <LabelText> You’ll receive</LabelText>
          </Row>
          <Row>
            <Input placeholder="00.0" />
            <DropDown
              onOptionSelect={(selected: string) => setToken(selected)}
              options={currencyList}
            />
          </Row>
        </Label>
      </SwapContainer>
      {filteredPaymentMethod().length > 0 && (
        <>
          <Column>
            Choose payment gateway
            <OptionContainer>
              <Option>
                <div>
                  <img src={Banxa} alt="banxa" />
                  Banxa
                </div>{' '}
                <Fees>
                  Receive approx. 0.03455 ETH <Check className="active" />
                </Fees>
              </Option>
            </OptionContainer>
          </Column>
          <Column>
            Choose payment method
            <OptionContainer>
              {console.log(filteredPaymentMethod())}
              {filteredPaymentMethod().map((currentMethod) => {
                const { logo_url, paymentType, name, transaction_fees, id } =
                  currentMethod
                const [fee] = transaction_fees.filter(
                  (fees) => fees.coin_code === token
                )
                const activeFee = fee.fees[0]
                const finalFee =
                  activeFee?.type === 'percentage'
                    ? (activeFee?.amount * 100)?.toFixed(2) + '%'
                    : `${activeFee?.amount || 0} ${fee.fiat_code}`

                return (
                  <OptionWrapper
                    key={id}
                    onClick={() => handleSelecPaymentMethod(String(id))}
                  >
                    <Option>
                      <div>
                        <IconMethod
                          src={logo_url}
                          alt={paymentType}
                          width={20}
                        />
                        {name}
                      </div>{' '}
                      <Fees>
                        Fees: {finalFee}
                        <Check
                          className={
                            String(id) === selectedPaymentMethod ? 'active' : ''
                          }
                        />
                      </Fees>
                    </Option>
                  </OptionWrapper>
                )
              })}
            </OptionContainer>
          </Column>
          <Column>
            <ButtonContainer>
              <Button
                style={{}}
                disabled={false}
                loading={false}
                pulsate={false}
                tooltip=""
                size="medium"
                className=""
                sx={{ width: '150px', margin: '0px auto' }}
                fullWidth={true}
                onClick={() => handleCreateOrder()}
                color="primary"
                variant="contained"
                triggerTime={1000}
              >
                Buy {token} Now
              </Button>
            </ButtonContainer>
          </Column>
        </>
      )}
      {filteredPaymentMethod().length === 0 &&
        'There are no payment methods available for the selected currency/token.'}
    </BanxaContainer>
  )
}

export default React.memo(BanxaBridge)
