import json
import redis
import os
from web3 import Web3
from eth_abi import abi
import textwrap
from dotenv import load_dotenv
load_dotenv()

REDIS_URL = os.environ.get('REDIS_URL')  # is None if not found
REDIS_PORT = os.environ.get('REDIS_PORT')  # is None if not found

def hc_verifyCAPTCHA(event, context):
  body = json.loads(event["body"])

  #print('FROM Geth', body)

  paramsHexString = body['params'][0]

  splitted_params = textwrap.wrap(paramsHexString[2:], 64)
  uuid = '0x' + splitted_params[0]
  key = '0x' + splitted_params[1]
  to = abi.decode(['address'], bytes.fromhex(splitted_params[2]))
  to = Web3.to_checksum_address(to[0])

  # Connect to Redis Elasticache
  db = redis.StrictRedis(host=REDIS_URL,
                         port=REDIS_PORT)

  # Store and set the expire time as 10 minutes
  keyInRedis = db.get(uuid + to)

  if keyInRedis:
    #print('keyInRedis: ', keyInRedis.decode('utf-8'), 'key: ', key)
    isMatch = keyInRedis.decode('utf-8') == key
    return returnPayload(isMatch)
  else:
    return returnPayload(False)

def returnPayload(status):
    # We return 0 or 1 using uint256
    payload = '0x' # v1 + '{0:0{1}x}'.format(int(32), 64)
    if status:
        payload += '{0:0{1}x}'.format(int(1), 64)
    else:
        payload += '{0:0{1}x}'.format(int(0), 64)

    returnPayload = {
        'statusCode': 200,
        'body':json.dumps({
          "result": payload
        })
    }

    #print('Return payload: ', payload)

    return returnPayload
