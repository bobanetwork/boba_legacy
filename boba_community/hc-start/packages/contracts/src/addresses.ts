import { isTestEnv } from '@hc/react-app/src/utils/environment.utils'

const addressesTestnet = {
  // proxy at 0x701E03911e342Ca5Fa0950ce1680Af40e6171BA1
  HybridComputeHelper: '0xBc8dd915c26F0e8A5416e0850450f2f0614f8617',
  HybridComputeHelperFactory: '0xFeED2Dc24E3CCd9594B5122318F1b6c037492652',
  BobaToken: '0x4200000000000000000000000000000000000023',
}

const addressesMainnet = {
  // proxy at 0x00DF42117930729995f43C41aC780fe54f7f4459
  HybridComputeHelper: '0xC1A8Bdfc2f8b67268E44b2C2D868a8f28E007E2D',
  HybridComputeHelperFactory: '0xCf3887f584B9Ec84E5E39a73fF5c6F327f4656ec',
  BobaToken: '0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7',
}
export default isTestEnv() ? addressesTestnet : addressesMainnet


