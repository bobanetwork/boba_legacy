# https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/AWS_code/turing_oracle.py

import json
import urllib3
import certifi
from web3 import Web3
import time

authorized_contract = None  # for open access

HCAPTCHA_API_SECRET = '0x'  # do not push
VERIFY_URL = "https://hcaptcha.com/siteverify"
PRIVATE_KEY = '0x'  # TODO: do not push
SENDER_ADDRESS = "0x"

LIMIT_LIST_FILE = "/tmp/addresses.json"
TOKEN_ABI = [
  {"constant": True, "inputs": [], "name": "name", "outputs": [{"name": "", "type": "string"}], "payable": False,
   "stateMutability": "view", "type": "function"},
  {"constant": False, "inputs": [{"name": "_upgradedAddress", "type": "address"}], "name": "deprecate", "outputs": [],
   "payable": False, "stateMutability": "nonpayable", "type": "function"},
  {"constant": False, "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}],
   "name": "approve", "outputs": [], "payable": False, "stateMutability": "nonpayable", "type": "function"},
  {"constant": True, "inputs": [], "name": "deprecated", "outputs": [{"name": "", "type": "bool"}], "payable": False,
   "stateMutability": "view", "type": "function"},
  {"constant": False, "inputs": [{"name": "_evilUser", "type": "address"}], "name": "addBlackList", "outputs": [],
   "payable": False, "stateMutability": "nonpayable", "type": "function"},
  {"constant": True, "inputs": [], "name": "totalSupply", "outputs": [{"name": "", "type": "uint256"}],
   "payable": False, "stateMutability": "view", "type": "function"}, {"constant": False,
                                                                      "inputs": [{"name": "_from", "type": "address"},
                                                                                 {"name": "_to", "type": "address"},
                                                                                 {"name": "_value",
                                                                                  "type": "uint256"}],
                                                                      "name": "transferFrom", "outputs": [],
                                                                      "payable": False,
                                                                      "stateMutability": "nonpayable",
                                                                      "type": "function"},
  {"constant": True, "inputs": [], "name": "upgradedAddress", "outputs": [{"name": "", "type": "address"}],
   "payable": False, "stateMutability": "view", "type": "function"},
  {"constant": True, "inputs": [{"name": "", "type": "address"}], "name": "balances",
   "outputs": [{"name": "", "type": "uint256"}], "payable": False, "stateMutability": "view", "type": "function"},
  {"constant": True, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint256"}], "payable": False,
   "stateMutability": "view", "type": "function"},
  {"constant": True, "inputs": [], "name": "maximumFee", "outputs": [{"name": "", "type": "uint256"}],
   "payable": False, "stateMutability": "view", "type": "function"},
  {"constant": True, "inputs": [], "name": "_totalSupply", "outputs": [{"name": "", "type": "uint256"}],
   "payable": False, "stateMutability": "view", "type": "function"},
  {"constant": False, "inputs": [], "name": "unpause", "outputs": [], "payable": False,
   "stateMutability": "nonpayable", "type": "function"},
  {"constant": True, "inputs": [{"name": "_maker", "type": "address"}], "name": "getBlackListStatus",
   "outputs": [{"name": "", "type": "bool"}], "payable": False, "stateMutability": "view", "type": "function"},
  {"constant": True, "inputs": [{"name": "", "type": "address"}, {"name": "", "type": "address"}], "name": "allowed",
   "outputs": [{"name": "", "type": "uint256"}], "payable": False, "stateMutability": "view", "type": "function"},
  {"constant": True, "inputs": [], "name": "paused", "outputs": [{"name": "", "type": "bool"}], "payable": False,
   "stateMutability": "view", "type": "function"},
  {"constant": True, "inputs": [{"name": "who", "type": "address"}], "name": "balanceOf",
   "outputs": [{"name": "", "type": "uint256"}], "payable": False, "stateMutability": "view", "type": "function"},
  {"constant": False, "inputs": [], "name": "pause", "outputs": [], "payable": False, "stateMutability": "nonpayable",
   "type": "function"},
  {"constant": True, "inputs": [], "name": "getOwner", "outputs": [{"name": "", "type": "address"}], "payable": False,
   "stateMutability": "view", "type": "function"},
  {"constant": True, "inputs": [], "name": "owner", "outputs": [{"name": "", "type": "address"}], "payable": False,
   "stateMutability": "view", "type": "function"},
  {"constant": True, "inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "payable": False,
   "stateMutability": "view", "type": "function"},
  {"constant": False, "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
   "name": "transfer", "outputs": [], "payable": False, "stateMutability": "nonpayable", "type": "function"},
  {"constant": False,
   "inputs": [{"name": "newBasisPoints", "type": "uint256"}, {"name": "newMaxFee", "type": "uint256"}],
   "name": "setParams", "outputs": [], "payable": False, "stateMutability": "nonpayable", "type": "function"},
  {"constant": False, "inputs": [{"name": "amount", "type": "uint256"}], "name": "issue", "outputs": [],
   "payable": False, "stateMutability": "nonpayable", "type": "function"},
  {"constant": False, "inputs": [{"name": "amount", "type": "uint256"}], "name": "redeem", "outputs": [],
   "payable": False, "stateMutability": "nonpayable", "type": "function"},
  {"constant": True, "inputs": [{"name": "_owner", "type": "address"}, {"name": "_spender", "type": "address"}],
   "name": "allowance", "outputs": [{"name": "remaining", "type": "uint256"}], "payable": False,
   "stateMutability": "view", "type": "function"},
  {"constant": True, "inputs": [], "name": "basisPointsRate", "outputs": [{"name": "", "type": "uint256"}],
   "payable": False, "stateMutability": "view", "type": "function"},
  {"constant": True, "inputs": [{"name": "", "type": "address"}], "name": "isBlackListed",
   "outputs": [{"name": "", "type": "bool"}], "payable": False, "stateMutability": "view", "type": "function"},
  {"constant": False, "inputs": [{"name": "_clearedUser", "type": "address"}], "name": "removeBlackList",
   "outputs": [], "payable": False, "stateMutability": "nonpayable", "type": "function"},
  {"constant": True, "inputs": [], "name": "MAX_UINT", "outputs": [{"name": "", "type": "uint256"}], "payable": False,
   "stateMutability": "view", "type": "function"},
  {"constant": False, "inputs": [{"name": "newOwner", "type": "address"}], "name": "transferOwnership", "outputs": [],
   "payable": False, "stateMutability": "nonpayable", "type": "function"},
  {"constant": False, "inputs": [{"name": "_blackListedUser", "type": "address"}], "name": "destroyBlackFunds",
   "outputs": [], "payable": False, "stateMutability": "nonpayable", "type": "function"}, {
    "inputs": [{"name": "_initialSupply", "type": "uint256"}, {"name": "_name", "type": "string"},
               {"name": "_symbol", "type": "string"}, {"name": "_decimals", "type": "uint256"}], "payable": False,
    "stateMutability": "nonpayable", "type": "constructor"},
  {"anonymous": False, "inputs": [{"indexed": False, "name": "amount", "type": "uint256"}], "name": "Issue",
   "type": "event"},
  {"anonymous": False, "inputs": [{"indexed": False, "name": "amount", "type": "uint256"}], "name": "Redeem",
   "type": "event"},
  {"anonymous": False, "inputs": [{"indexed": False, "name": "newAddress", "type": "address"}], "name": "Deprecate",
   "type": "event"}, {"anonymous": False, "inputs": [{"indexed": False, "name": "feeBasisPoints", "type": "uint256"},
                                                     {"indexed": False, "name": "maxFee", "type": "uint256"}],
                      "name": "Params", "type": "event"}, {"anonymous": False, "inputs": [
    {"indexed": False, "name": "_blackListedUser", "type": "address"},
    {"indexed": False, "name": "_balance", "type": "uint256"}], "name": "DestroyedBlackFunds", "type": "event"},
  {"anonymous": False, "inputs": [{"indexed": False, "name": "_user", "type": "address"}], "name": "AddedBlackList",
   "type": "event"},
  {"anonymous": False, "inputs": [{"indexed": False, "name": "_user", "type": "address"}], "name": "RemovedBlackList",
   "type": "event"}, {"anonymous": False, "inputs": [{"indexed": True, "name": "owner", "type": "address"},
                                                     {"indexed": True, "name": "spender", "type": "address"},
                                                     {"indexed": False, "name": "value", "type": "uint256"}],
                      "name": "Approval", "type": "event"}, {"anonymous": False, "inputs": [
    {"indexed": True, "name": "from", "type": "address"}, {"indexed": True, "name": "to", "type": "address"},
    {"indexed": False, "name": "value", "type": "uint256"}], "name": "Transfer", "type": "event"},
  {"anonymous": False, "inputs": [], "name": "Pause", "type": "event"},
  {"anonymous": False, "inputs": [], "name": "Unpause", "type": "event"}]
ERC20_CONTRACT_ADDR = "0x4200000000000000000000000000000000000023"  # token (BOBA on BobaGoerli, or tBNB, etc. on alt-l2s)

SUPPORTED_NETWORKS = {
  "BOBA_BNB_TESTNET": "https://replica.testnet.bnb.boba.network",
  "BOBA_GOERLI_TESTNET": "https://boba-goerli.gateway.tenderly.co/1clfZoq7qEGyF4SQvF8gvI",
  "BOBA_AVAX_TESTNET": "https://replica.testnet.avax.boba.network",
}


# or...
# authorized_contract = '0xOF_YOUR_HELPER_CONTRACT' # to restrict access to only your smart contract

# NOTE: When taking the data payload from the original event for debugging then remove the first 64 bits!
def lambda_handler(input, context):
  print("DEBUG: from L2:", input)

  hcaptcha_client_response = input['hcaptcha_resp']
  network = input['network']
  wallet_addr = input['wallet_addr']

  print("ClientRequest to verify: ", hcaptcha_client_response, network, wallet_addr)

  if network not in SUPPORTED_NETWORKS:
    return {
      'statusCode': 400,
      'body': json.dumps({
        "error": "Network " + network + " not supported!"
      })
    }
  provider_url = SUPPORTED_NETWORKS[network]
  is_alt_l2 = True
  if network == "BOBA_GOERLI_TESTNET":
    is_alt_l2 = False

  print("Using network config: ", provider_url, "Is alt l2: ", is_alt_l2)

  allowed_to_claim, wallets_claimed, error_msg = validate_request(wallet_addr=wallet_addr,
                                                                  hcaptcha_client_response=hcaptcha_client_response)

  if allowed_to_claim:
    return_payload = issue_testnet_funds(wallets_claimed=wallets_claimed, wallet_addr=wallet_addr,
                                         provider_url=provider_url, is_alt_l2=is_alt_l2)
  else:
    return_payload = {
      'statusCode': 400,
      'body': json.dumps({
        "error": error_msg
      })
    }

  print('return payload:', return_payload)

  return return_payload


def validate_request(wallet_addr, hcaptcha_client_response):
  with open(LIMIT_LIST_FILE, 'w+') as f:
    prev_wallets_claimed = f.read()
    wallets_claimed = json.loads("{}" if prev_wallets_claimed == "" else prev_wallets_claimed)

  now = time.time()
  if wallet_addr not in wallets_claimed:
    time_limit_ok = True
  else:
    last_claimed = wallets_claimed[wallet_addr]
    time_limit_ok = (now - last_claimed) > 86400  # 1 day in seconds

  print("Time limit ok: ", time_limit_ok)
  allowed_to_claim = time_limit_ok and check_hcaptcha(hcaptcha_client_response)

  error_msg = "No error"
  if not allowed_to_claim:
    if not time_limit_ok:
      error_msg = "Wait 24h"
    else:
      error_msg = "Captcha failed"

  print("Allowed to claim: ", allowed_to_claim, "Error: ", error_msg)

  return allowed_to_claim, wallets_claimed, error_msg


def issue_testnet_funds(wallets_claimed, wallet_addr, provider_url, is_alt_l2):
  # Save before, in case that one tx fails, then user can't infinitely claim the nativeAsset
  with open(LIMIT_LIST_FILE, 'w') as f:
    wallets_claimed[wallet_addr] = time.time()
    f.write(json.dumps(wallets_claimed))
    print("Wrote to file, saved state: ", wallets_claimed)

  provider = Web3(Web3.HTTPProvider(provider_url))

  if is_alt_l2:
    native_amount = provider.to_wei(number=1, unit='ether') # boba native
    token_amount = provider.to_wei(number=0.1, unit='ether') # L1 native, here token
  else:
    native_amount = provider.to_wei(number=0.1, unit='ether') # eth
    token_amount = provider.to_wei(number=1, unit='ether') # boba token

  # send native
  gas = 2000000
  nonce = provider.eth.get_transaction_count(SENDER_ADDRESS)
  nativeTx = {
    'nonce': nonce,
    'to': wallet_addr,
    'value': native_amount,
    'gas': gas,
    'gasPrice': provider.eth.gas_price
  }
  print("Native tx: ", nativeTx)
  print("SENDER balance: ", provider.eth.get_balance(SENDER_ADDRESS))

  nativeTxId, error_native, error_msg_native = send_tx(provider, nativeTx)

  # Send token
  erc20_contract = provider.eth.contract(ERC20_CONTRACT_ADDR, abi=TOKEN_ABI)
  if not error_native:
    nonce = nonce + 1

  tokenTx = {
    'nonce': nonce,
    'to': ERC20_CONTRACT_ADDR,
    'value': "0x0",
    'gas': gas,
    'gasPrice': provider.eth.gas_price,
    'data': erc20_contract.encodeABI('transfer', args=(wallet_addr, token_amount))
  }
  print("Token tx: ", tokenTx)

  token_tx_id, error_token, error_msg_token = send_tx(provider, tokenTx)

  return {
    'statusCode': 400 if (error_native or error_token) else 200,
    'body': json.dumps({
      "nativeTx": {
        "error": error_native,
        "errorMsg": error_msg_native,
        "nativeTxId": nativeTxId,
      },
      "tokenTx": {
        "error": error_token,
        "errorMsgToken": error_msg_token,
        "tokenTxId": token_tx_id,
      }
    })
  }


def send_tx(provider, tx):
  # dynamic provider url to serve all testnets (obviously this private key should only hold testnet funds)

  signed_tx = provider.eth.account.sign_transaction(tx, PRIVATE_KEY)
  tx_hash_hex = "0x"
  error_msg = ""
  error = False

  try:
    tx_hash = provider.eth.send_raw_transaction(signed_tx.rawTransaction)
    tx_hash_hex = provider.to_hex(tx_hash)
  except Exception as err:
    error_msg = str(err)
    error = True

  print("Transaction hash: ", tx_hash_hex, "on network: ", provider)
  return tx_hash_hex, error, error_msg


def check_hcaptcha(clientResponse):
  # Create a PoolManager instance for sending requests.
  http = urllib3.PoolManager(ca_certs=certifi.where())

  # Send a POST request and receive a HTTPResponse object.
  headers = {'Content-Type': 'application/x-www-form-urlencoded'}
  data = {'response': clientResponse, 'secret': HCAPTCHA_API_SECRET}

  resp = http.request("POST",
                      VERIFY_URL,
                      fields=data,
                      headers=headers)
  result = json.loads(resp.data)
  print("result: ", result)

  is_allowed_to_claim = result["success"]
  print("from endpoint:", is_allowed_to_claim)

  return is_allowed_to_claim
