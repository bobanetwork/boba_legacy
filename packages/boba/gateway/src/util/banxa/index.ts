import axios from 'axios'

const BANXA_ENDPOINT = 'http://localhost:4000'

type FiatType = {
  fiat_code: string
  fiat_name: string
  fiat_symbol: string
}

type blockchainType = {
  code: string
  description: string
  is_default: boolean
}
type CoinType = {
  coin_code: string
  coin_name: string
  blockchains: blockchainType[]
}

type feesType = {
  name: string
  amount: number
  type: string
}
type TransactionFeesType = {
  fiat_code: string
  coin_code: string
  fees: feesType[]
}

type TransactionLimitType = {
  fiat_code: string
  min: number
  max: number
}
export type PaymentMethod = {
  id: number
  name: string
  description: string
  logo_url: string
  status: string
  type: string
  paymentType: string
  supported_agents: null
  supported_fiat: string[]
  supported_coin: string[]
  transaction_fees: TransactionFeesType[]
  transaction_limits: TransactionLimitType[]
}

export interface OrderParams {
  account_reference: string
  source: string
  source_amount: string | undefined
  target: string
  wallet_address: string
  return_url_on_success?: string
  payment_method_id: string
}

export const getStatics = async (): Promise<any> => {
  try {
    const response = await axios.get(`${BANXA_ENDPOINT}/statics`)
    return response.data
  } catch (error) {
    console.error(error)
  }
}

export const createOrder = (params: OrderParams) => {
  const parameters = {
    return_url_on_success: 'https://gateway.boba.network/?orderStatus=created',
    ...params,
  }

  axios
    .post(`${BANXA_ENDPOINT}/create-order`, parameters)
    .then((response) => {
      console.log(response.data)
    })
    .catch((error) => {
      console.error(error)
    })
}
