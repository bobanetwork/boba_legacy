# https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/AWS_code/turing_oracle.py

import json
import urllib3
import certifi
from web3 import Web3
import time

authorized_contract = None  # for open access

HCAPTCHA_API_SECRET = '0x'  # do not push
VERIFY_URL = "https://hcaptcha.com/siteverify"
PRIVATE_KEY = "0x"  # TODO: do not push
SENDER_ADDRESS = "0x"

LIMIT_LIST_FILE = "/tmp/addresses.json"


# or...
# authorized_contract = '0xOF_YOUR_HELPER_CONTRACT' # to restrict access to only your smart contract

# NOTE: When taking the data payload from the original event for debugging then remove the first 64 bits!
def lambda_handler(input, context):
  print("DEBUG: ", input)

  print("DEBUG: from Geth:", input)

  hcaptcha_client_response = input['hcaptcha_resp']
  provider_url = input['provider_url']
  wallet_addr = input['wallet_addr']

  print("ClientRequest to verify: ", hcaptcha_client_response, provider_url, wallet_addr)

  with open(LIMIT_LIST_FILE, 'w+') as f:
    prev_wallets_claimed = f.read()
    wallets_claimed = json.loads("{}" if prev_wallets_claimed == "" else prev_wallets_claimed)

  now = time.time()
  if wallet_addr not in wallets_claimed:
    time_limit_ok = True
  else:
    last_claimed = wallets_claimed[wallet_addr]
    time_limit_ok = (now - last_claimed) > 86400  # 1 day in seconds

  allowed_to_claim = time_limit_ok and check_hcaptcha(hcaptcha_client_response)
  if not allowed_to_claim:
    if not time_limit_ok:
      error_msg = "Wait 24h"
    else:
      error_msg = "Captcha failed"

  if allowed_to_claim:
    # TBD: potentially add rpc url whitelist
    txId = send_tx(provider_url, wallet_addr)

    with open(LIMIT_LIST_FILE, 'w') as f:
      wallets_claimed[wallet_addr] = now
      f.write(wallets_claimed)

    returnPayload = {
      'statusCode': 200,
      'body': json.dumps({
        "error": False,
        "txId": txId
      })
    }
  else:
    returnPayload = {
      'statusCode': 400,
      'body': json.dumps({
        "error": error_msg
      })
    }

  print('return payload:', returnPayload)

  return returnPayload


def send_tx(provider_url, wallet_addr):
  # dynamic provider url to serve all testnets (obviously this private key should only hold testnet funds)
  provider = Web3(Web3.HTTPProvider(provider_url))
  tx = {
    'nonce': provider.eth.getTransactionCount(SENDER_ADDRESS),
    'to': wallet_addr,
    'value': provider.toWei(0.1, 'ether'),
    'gas': 200000,
    'gasPrice': provider.toWei('50', 'gwei')
  }
  signed_tx = provider.eth.account.sign_transaction(tx, PRIVATE_KEY)
  tx_hash = provider.eth.sendRawTransaction(signed_tx.rawTransaction)
  tx_hash_hex = provider.toHex(tx_hash)
  print("Transaction hash: ", tx_hash_hex, "on network: ", provider)
  return tx_hash_hex


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