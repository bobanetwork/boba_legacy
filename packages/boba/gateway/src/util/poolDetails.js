const POOL_DETAIL_MAPPING = {
  "0xcd14af5d13c91316127a0234c4fE7d72dA9D76e8": {
    name: 'BOBA-ETH',
    description: 'olongswap LP',
  },
  "0xE20EFfA9eDC92ef5a5Cf715b2f11f7Eaa0Ea40FB": {
    name: 'BOBA-ETH',
    description: 'olongswap LP',
  },
  "0x2d537a22a44999Bf150b71dC6CBb7aBE94797636": {
    name: 'BOBA-ETH',
    description: 'olongswap LP',
  },
  "0xbD20F6F5F1616947a39E11926E78ec94817B3931": {
    name: 'BOBA-ETH',
    description: 'olongswap LP',
  },
}


export const getPoolDetail = (poolId) => {
  return POOL_DETAIL_MAPPING[ poolId ]
}
