import json
from captcha.image import ImageCaptcha
import base64
from web3 import Web3
import uuid
import redis
import yaml


def turing_verifyCAPTCHA(event, context):

    body = json.loads(event["body"])

    print('FROM Geth', body)

    paramsHexString = body['params'][0]

    uuid = '0x' + paramsHexString[66: 130]
    key = '0x' + paramsHexString[130:]

    # Read YML
    with open("env.yml", 'r') as ymlfile:
        config = yaml.load(ymlfile)

    # Connect to Redis Elasticache
    db = redis.StrictRedis(host=config.get('REDIS_URL'),
                           port=config.get('REDIS_PORT'))

    # Store and set the expire time as 10 minutes
    keyInRedis = db.get(uuid)

    if keyInRedis:
        print('keyInRedis: ', keyInRedis.decode('utf-8'), 'key: ', key)
        isMatch = keyInRedis.decode('utf-8') == key
        return returnPayload(isMatch)
    else:
        return returnPayload(False)

def returnPayload(status):
    # We return 0 or 1 using uint256
    payload = '0x' + '{0:0{1}x}'.format(int(32), 64)
    if status:
        payload += '{0:0{1}x}'.format(int(1), 64)
    else:
        payload += '{0:0{1}x}'.format(int(0), 64)

    returnPayload = {
        'statusCode': 200,
        'body': json.dumps({ 'result': payload })
    }

    print('Return payload: ', payload)

    return returnPayload
