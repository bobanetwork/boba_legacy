import { isTestEnv } from '@turing/react-app/src/utils/environment.utils'

const addressesTestnet = {
  TuringHelper: '0xA00f82C6fe87E81ab3501A21c47227e84e3d9C48',
  TuringHelperFactory: '0x58dDFB37998584991d8b75F87baf0A3428dD095e',
  BobaToken: '0xF5B97a4860c1D81A1e915C40EcCB5E4a5E6b8309',
}

const addressesMainnet = {
  // TODO
  TuringHelper: '',
  TuringHelperFactory: '',
  BobaToken: '',
}
export default isTestEnv() ? addressesTestnet : addressesMainnet
