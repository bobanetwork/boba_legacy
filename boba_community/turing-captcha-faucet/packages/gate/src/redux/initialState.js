const initialStore = {
  network: {
    blockNumber: 0,
    gasPrice: 0,
  },
  wallet: {
    connected: false,
    account: '',
    balance: 0,
    balanceInWei: 0,
    connectedError: false
  },
  ui: {
    alert: null,
    error: null,
  },
  captcha: {
    loading: false,
    uuid: '0x',
    imageBase64: null,
  }
};

export default initialStore;