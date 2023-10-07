import json
from captcha.image import ImageCaptcha
import base64
from web3 import Web3
import uuid
import redis
import os
from dotenv import load_dotenv
load_dotenv()

REDIS_URL = os.environ.get('REDIS_URL')  # is None if not found
REDIS_PORT = os.environ.get('REDIS_PORT')  # is None if not found
IS_LOCAL = os.environ.get('IS_LOCAL') == 'True'

def hc_getCAPTCHA(event, context):
    err_response = {
      "statusCode": 400,
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
        "result": {"error": "Unknown error"}
      })
    }

    if event is None or event == "" or event is {} or event == "{}":
      err_response["body"] = json.dumps({
        "result": {"error": "No data provided."}
      })
      return err_response

    body = json.loads(event["body"])

    image = ImageCaptcha(width=280, height=90)

    # For image
    uuid1 = uuid.uuid4()
    imageStr = str(uuid1).split('-')[0]
    imageStrBytes = Web3.solidity_keccak(['string'], [str(imageStr)]).hex()

    # For key
    if "to" not in body:
      err_response["body"] = json.dumps({
        "result": {"error": "No address provided."}
      })
      return err_response

    uuid2 = uuid.uuid4()
    toAddr = Web3.to_checksum_address(body['to'])

    uuidBytes = Web3.solidity_keccak(['string'], [str(uuid2)]).hex()
    keyBytes = uuidBytes + toAddr

    # Use the first random string
    imageData = image.generate(imageStr)

    # Get base64
    imageBase64 = base64.b64encode(imageData.getvalue())

    # Connect to Redis Elasticache
    db = redis.StrictRedis(host=REDIS_URL,
                           port=REDIS_PORT)

    # Store and set the expire time as 10 minutes
    #print('keyBytes: ', keyBytes, 'imageStrBytes: ', imageStrBytes, 'imageStr: ', imageStr)
    db.set(keyBytes, imageStrBytes, ex=600)

    payload = {'uuid': uuidBytes, 'imageBase64': imageBase64.decode('utf-8') }

    if IS_LOCAL:
      payload['imageStr'] = str(imageStr)

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


