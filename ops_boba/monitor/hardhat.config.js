require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-waffle')

const config = {
  mocha: {
    timeout: 300000,
  },
  networks: {
    localhost: {
      url: 'http://localhost:9545',
      allowUnlimitedContractSize: true,
      timeout: 1800000,
      accounts: [
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      ],
    },
  },
}

module.exports = config
