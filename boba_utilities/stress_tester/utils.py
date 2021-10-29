#!python
#
# Copyright 2021 mmontour@enya.ai. Internal use only; all rights reserved
#
# Utility functions for stress tester, fraud detector, Boba-NG agents, etc.

from web3 import Web3
from web3.gas_strategies.time_based import fast_gas_price_strategy
from web3.middleware import geth_poa_middleware
from web3.logs import STRICT, IGNORE, DISCARD, WARN
import requests,json
import os,sys,time

class Account:
  def __init__(self, address, key):
    self.address = address
    self.key = key
    self.nonce = [0]*3

  def setNonces(self,rpcs):
    self.nonce[1] = rpcs[1].eth.get_transaction_count(self.address)
    self.nonce[2] = rpcs[2].eth.get_transaction_count(self.address)

class Addrs:

  addrs = []

  def __init__(self, env):
    dev = {}
    try:
      with open("/tmp/addr.json","r") as addr_file:
        text = addr_file.read()

        dev = json.loads(text)
    except:
      # Needed for Boba-NG prototype, optional for other services.
      print("/tmp/addr.json not found")
    a1 = {}
    a2 = {}

    if 'addresses' in env:
      a1 = env['addresses']
    elif 'address_file' in env:
      with open(env['address_file'],"r") as addr_file:
        text = addr_file.read()
        a1 = json.loads(text)
    else:
      core_addrs = requests.get(env['address_server'] + "/addresses.json")
      a1 = json.loads(core_addrs.text)
      boba_addrs = None
      if 'address_server_2' in env: # Legacy
        boba_addrs = requests.get(env['address_server_2'] + "/addresses.json")
      else:
        boba_addrs = requests.get(env['address_server'] + "/boba-addr.json")

      if boba_addrs:
        a2 = json.loads(boba_addrs.text)

    # From packages/contracts/src/predeploys.ts
    predeploys = {
      'Zero_Address': '0x0000000000000000000000000000000000000000',
      'OVM_L2ToL1MessagePasser': '0x4200000000000000000000000000000000000000',
      'OVM_L1MessageSender': '0x4200000000000000000000000000000000000001',
      'OVM_DeployerWhitelist': '0x4200000000000000000000000000000000000002',
      'OVM_ETH': '0x4200000000000000000000000000000000000006',
      'L2CrossDomainMessenger': '0x4200000000000000000000000000000000000007',
      'OVM_GasPriceOracle': '0x420000000000000000000000000000000000000F',
      'L2StandardBridge': '0x4200000000000000000000000000000000000010',
      'OVM_SequencerFeeVault': '0x4200000000000000000000000000000000000011',
      'L2StandardTokenFactory': '0x4200000000000000000000000000000000000012',
      'OVM_L1BlockNumber': '0x4200000000000000000000000000000000000013',
    }

    hardhat = {
    'GAS_ORACLE': '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    'SEQUENCER': '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    'PROPOSER': '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    'HARDHAT_03': '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
    'HARDHAT_04': '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
    'HARDHAT_05': '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc',
    'HARDHAT_06': '0x976ea74026e726554db657fa54763abd0c3a0aa9',
    'HARDHAT_07': '0x14dc79964da2c08b23698b3d3cc7ca32193d9955',
    'RELAYER': '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f',
    'HARDHAT_09': '0xa0ee7a142d267c1f36714e4a8f75612f20a79720',
    'HARDHAT_10': '0xbcd4042de499d14e55001ccbb24a551f3b954096',
    'HARDHAT_11': '0x71be63f3384f5fb98995898a86b02fb2426c5788',
    'HARDHAT_12': '0xfabb0ac9d68b0b445fb7357272ff202c5651694a',
    'HARDHAT_13': '0x1cbd3b2770909d4e10f157cabc84c7264073c9ec',
    'HARDHAT_14': '0xdf3e18d64bc6a983f673ab319ccae4f1a57c7097',
    'HARDHAT_15': '0xcd3b766ccdd6ae721141f452c550ca635964ce71',
    'HARDHAT_16': '0x2546bcd3c84621e976d8185a91a922ae77ecec30',
    'HARDHAT_17': '0xbda5747bfd65f08deb54cb465eb87d40e51b197e',
    'FAST_RELAYER': '0xdd2fd4581271e230360230f9337d5c0430bf44c0',
    'HARDHAT_19': '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199'
    }

    for i in hardhat:
      hardhat[i] = Web3.toChecksumAddress(hardhat[i])

    self.boba_addrs = {**a2, **a1, **predeploys, **hardhat, **dev}

    self.addr_names = {}
    for k in self.boba_addrs:
      v = self.boba_addrs[k]
      if type(v) is str:
        self.addr_names[v] = k

  def addrName(self,addr):
    if addr in self.addr_names:
      return self.addr_names[addr]
    else:
      return addr  

class Context:
  def __init__(self, env, addrs, logpath=None, logLabel=None):
    self.rpc = [None]*4
    self.rpc[1] = Web3(Web3.HTTPProvider(env['endpoints'][0]))
    assert (self.rpc[1].isConnected())
    self.rpc[2] = Web3(Web3.HTTPProvider(env['endpoints'][1]))
    assert (self.rpc[2].isConnected())

    self.chainIds = [None]*3
    self.chainIds[1] = self.rpc[1].eth.chain_id
    self.chainIds[2] = self.rpc[2].eth.chain_id

    self.signatures = dict()
    l1C = self.loadL1Contracts(self.rpc[1], addrs.boba_addrs, env['ng_enabled'])
    l2C = self.loadL2Contracts(self.rpc[2], addrs.boba_addrs, env['ng_enabled'])
    self.contracts = {**l1C, **l2C}

    gasPrice = [0]*3
    # Rinkeby seems to work at 0.5 gwei, ~75s
    gasPrice[1] = Web3.toWei(env['gas_price_gwei'][0],'gwei')  # FIXME - try to estimate it (fails on local network)
    gasPrice[2] = Web3.toWei(env['gas_price_gwei'][1],'gwei') # This one is fixed

    # see https://web3py.readthedocs.io/en/stable/middleware.html#geth-style-proof-of-authority
    if env['L1_geth_PoA']:
      self.rpc[1].middleware_onion.inject(geth_poa_middleware, layer=0)
    self.rpc[2].middleware_onion.inject(geth_poa_middleware, layer=0)

    if len(env['endpoints']) > 2:
      self.rpc[3] = Web3(Web3.HTTPProvider(env['endpoints'][2]))
      assert (self.rpc[2].isConnected())
      self.rpc[3].middleware_onion.inject(geth_poa_middleware, layer=0)

    if logpath:
      self.log = open(logpath, "a")
      self.log.write("# Started at " + time.asctime(time.gmtime()) + "\n")
      self.logLabel = logLabel

  def addSig(self,method,abi):
    sig = Web3.toHex(Web3.sha3(text=method + abi))
    self.signatures[sig] = method

  def nameSig(self,sig):
    if sig in self.signatures:
      return self.signatures[sig]
    else:
      return sig

  def loadContract(self,rpc, addr, abiPath):
    with open(abiPath) as f:
      abi = json.loads(f.read())['abi']
    c = rpc.eth.contract(address=addr, abi=abi)

    for x in abi:
      if x['type'] == 'event':
        abi_str=None
        for y in x['inputs']:
          if abi_str is None:
            abi_str = "("+y['type'] # or is it internalType?
          else:
            abi_str = abi_str + "," + y['type']
        abi_str = abi_str + ")"
        #print("ABI:",x['name'],abi_str)
        self.addSig(x['name'],abi_str)
    return c

  def loadL1Contracts(self,rpc,boba_addrs,ng):
    contracts = dict()

    contracts['LP_1'] = self.loadContract(rpc,boba_addrs['Proxy__L1LiquidityPool'],'./contracts/L1LiquidityPool.json')
    contracts['SB_1'] = self.loadContract(rpc,boba_addrs['Proxy__L1StandardBridge'], './contracts/L1StandardBridge.json')
    contracts['CTC'] = self.loadContract(rpc,boba_addrs['CanonicalTransactionChain'],'./contracts/CanonicalTransactionChain.json')
    contracts['StateCommitmentChain'] = self.loadContract(rpc,boba_addrs['StateCommitmentChain'],'./contracts/StateCommitmentChain.json')
    try:
      contracts['OVM_L1CrossDomainMessenger'] = self.loadContract(rpc,boba_addrs['OVM_L1CrossDomainMessenger'],'./contracts/L1CrossDomainMessenger.json')
    except:
      contracts['OVM_L1CrossDomainMessenger'] = self.loadContract(rpc,boba_addrs['L1CrossDomainMessenger'],'./contracts/L1CrossDomainMessenger.json')  
    contracts['Proxy__L1CrossDomainMessenger'] = self.loadContract(rpc,boba_addrs['Proxy__L1CrossDomainMessenger'],'./contracts/L1CrossDomainMessenger.json')

    if ng:
      contracts['L1_BobaPortal'] = self.loadContract(rpc,boba_addrs['L1_BobaPortal'],'./contracts/L1_BobaPortal.json')
      contracts['L1_EthPool'] = self.loadContract(rpc,boba_addrs['L1_EthPool'],'./contracts/L1_EthPool.json')

    return contracts

  def loadL2Contracts(self,rpc,boba_addrs,ng):
    contracts = dict()

    contracts['LP_2'] = self.loadContract(rpc,boba_addrs['Proxy__L2LiquidityPool'],'./contracts/L2LiquidityPool.json')
    contracts['SB_2'] = self.loadContract(rpc,'0x4200000000000000000000000000000000000010','./contracts/L2StandardBridge.json')
    contracts['oETH'] = self.loadContract(rpc,'0x4200000000000000000000000000000000000006','./contracts/OVM_ETH.json')
    contracts['OVM_L2CrossDomainMessenger'] = self.loadContract(rpc,boba_addrs['L2CrossDomainMessenger'],'./contracts/L2CrossDomainMessenger.json')
    if ng:
      contracts['L2_BobaPortal'] = self.loadContract(rpc,boba_addrs['L2_BobaPortal'],'./contracts/L2_BobaPortal.json')
      contracts['L2_EthPool'] = self.loadContract(rpc,boba_addrs['L2_EthPool'],'./contracts/L2_EthPool.json')
    return contracts

  def signAndSubmit(self, c, tx):
    signed_tx = self.rpc[c.on_chain].eth.account.sign_transaction(tx, c.acct.key)
    ret = self.rpc[c.on_chain].eth.send_raw_transaction(signed_tx.rawTransaction)
    return ret

  def logPrint(msg, screenEcho = True):
    if screenEcho:
      if self.logLabel:
        print("--",self.logLabel,"-- ", msg)
      else:
        print(msg)
    if self.log:
      self.log.write(msg + "\n")

def LoadEnv():  
  if len(sys.argv) < 2:
    print("Usage:",sys.argv[0],"<target>")
    exit(1)

  env = None
  try:
    env_path = "./targets/"+sys.argv[1]+".json"
    with open(env_path) as f:
      env = json.loads(f.read())
  except:
    print("Unable to load target definition",env_path)
    exit(1)
  
  return env

def wPrint(log, ch, msg, screenEcho = True):
  if screenEcho:
    print("--",ch,"-- ", msg)
  log.write(msg + "\n")

def lPrint(log, msg, screenEcho = True):
  if screenEcho:
    print(msg)
  log.write(msg + "\n")
