import json
from web3 import Web3
import redis
import os
from dotenv import load_dotenv
load_dotenv()

# Consider AWS KMS
IS_LOCAL = os.environ.get('IS_LOCAL') == 'True'
PK_KEY = os.environ.get('LOCAL_PK_KEY') if IS_LOCAL else os.environ.get('PK_KEY') # is None if not found
RPC_URL = 'http://localhost:8545' if IS_LOCAL else os.environ.get('RPC_URL') # is None if not found
# todo for tests?
CONTRACT_FAUCET_ADDR = os.environ.get('CONTRACT_FAUCET_ADDR') # is None if not found

REDIS_URL = os.environ.get('REDIS_URL')  # is None if not found
REDIS_PORT = os.environ.get('REDIS_PORT')  # is None if not found

FAUCET_ABI=('[{"inputs": [{"internalType": "bytes32","name": "_uuid","type": "bytes32"},{"internalType": "string",'
            '"name": "_key","type": "string"}],"name": "getNativeFaucet","outputs": [],"stateMutability": '
            '"nonpayable","type": "function"}]')

def hc_sendMetaTx(event, context):
    body = json.loads(event["body"])

    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    account = w3.eth.account.from_key(PK_KEY)
    nonce = w3.eth.get_transaction_count(account)
    faucet_contract = w3.eth.contract(address=CONTRACT_FAUCET_ADDR, abi=FAUCET_ABI)
    tx = (faucet_contract.functions.getNativeFaucet(body.uuid, body.key, body.to)
               .build_transaction({
      'nonce': nonce
    }))

    signed_tx = w3.eth.account.sign_transaction(tx, PK_KEY)
    w3.eth.send_raw_transaction(signed_tx.raw_transaction)

    # todo verify signature, return nonce if not provided

    # Connect to Redis Elasticache
    db = redis.StrictRedis(host=REDIS_URL,
                           port=REDIS_PORT)


    payload = {'txHash': signed_tx.hash }

    response = {
        "statusCode": 201,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": True,
            "Strict-Transport-Security": "max-age=63072000; includeSubdomains; preload",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "same-origin",
            "Permissions-Policy": "*",
        },
        "body": json.dumps({
          "result": payload
        })
    }
    #print(response)

    return response


