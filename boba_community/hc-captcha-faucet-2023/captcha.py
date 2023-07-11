# https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/AWS_code/turing_oracle.py

import json
import urllib3
import certifi
from web3 import Web3

authorized_contract = None  # for open access

HCAPTCHA_API_SECRET = '0x'  # do not push
VERIFY_URL = "https://hcaptcha.com/siteverify"
PRIVATE_KEY = "0x" # TODO: do not push
SENDER_ADDRESS = "0x"


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

  allowed_to_claim = check_hcaptcha(hcaptcha_client_response)

  if allowed_to_claim:
    # TBD: potentially add rpc url whitelist
    txId = send_tx(provider_url, wallet_addr)

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
        "error": "Captcha failed"
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
  error_reason = 0
  headers = {'Content-Type': 'application/x-www-form-urlencoded'}
  # data = 'response='+clientResponse+'&secret='+HCAPTCHA_API_SECRET
  data = {'response': clientResponse, 'secret': HCAPTCHA_API_SECRET}

  resp = http.request("POST",
                      VERIFY_URL,
                      fields=data,
                      headers=headers)
  result = json.loads(resp.data)
  print("result: ", result)

  # maybe try-catch for better error msgs (tweet not existing, ..)
  is_allowed_to_claim = result[
    "success"]  # DISABLED FOR NOW: and account_exists_long_enough and account_public_metrics_check
  print("from endpoint:", is_allowed_to_claim)

  return is_allowed_to_claim
