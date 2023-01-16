import json
from captcha.image import ImageCaptcha
import base64
from web3 import Web3
import uuid
import redis
import yaml


def turing_getCAPTCHA(event, context):

    image = ImageCaptcha(width=280, height=90)

    # For image
    uuid1 = uuid.uuid4()
    imageStr = str(uuid1).split('-')[0]
    imageStrBytes = Web3.solidityKeccak(['string'], [str(imageStr)]).hex()

    # For key
    uuid2 = uuid.uuid4()
    keyBytes = Web3.solidityKeccak(['string'], [str(uuid2)]).hex()

    # Use the first random string
    imageData = image.generate(imageStr)

    # Get base64
    imageBase64 = base64.b64encode(imageData.getvalue())

    # Read YML
    with open("env.yml", 'r') as ymlfile:
        config = yaml.load(ymlfile)

    # Connect to Redis Elasticache
    db = redis.StrictRedis(host=config.get('REDIS_URL'),
                           port=config.get('REDIS_PORT'))

    # Store and set the expire time as 10 minutes
    print('keyBytes: ', keyBytes, 'imageStrBytes: ', imageStrBytes, 'imageStr: ', imageStr)
    db.set(keyBytes, imageStrBytes, ex=600)

    payload = {'uuid': keyBytes, 'imageBase64': imageBase64.decode('utf-8') }

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
        "body": json.dumps(payload)
    }

    return response
