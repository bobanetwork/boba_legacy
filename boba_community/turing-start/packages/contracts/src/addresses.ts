import { isTestEnv } from '@turing/react-app/src/utils/environment.utils'

const addressesTestnet = {
  TuringHelper: '0xA00f82C6fe87E81ab3501A21c47227e84e3d9C48',
  TuringHelperFactory: '0x58dDFB37998584991d8b75F87baf0A3428dD095e',
  BobaToken: '0xF5B97a4860c1D81A1e915C40EcCB5E4a5E6b8309',
}

const addressesMainnet = {
  // proxy at 0x00DF42117930729995f43C41aC780fe54f7f4459
  TuringHelper: '0xC1A8Bdfc2f8b67268E44b2C2D868a8f28E007E2D',
  TuringHelperFactory: '0xCf3887f584B9Ec84E5E39a73fF5c6F327f4656ec',
  BobaToken: '0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7',
}
export default isTestEnv() ? addressesTestnet : addressesMainnet


