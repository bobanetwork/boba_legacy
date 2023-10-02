import json
import redis
import os
from dotenv import load_dotenv
load_dotenv()

REDIS_URL = os.environ.get('REDIS_URL')  # is None if not found
REDIS_PORT = os.environ.get('REDIS_PORT')  # is None if not found

def hc_verifyCAPTCHA(event, context):
    body = json.loads(event["body"])

    #print('FROM Geth', body)

    paramsHexString = body['params'][0]

    uuid = '0x' + paramsHexString[2: 66]
    key = '0x' + paramsHexString[66:]

    # Connect to Redis Elasticache
    db = redis.StrictRedis(host=REDIS_URL,
                           port=REDIS_PORT)

    # Store and set the expire time as 10 minutes
    keyInRedis = db.get(uuid)

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
