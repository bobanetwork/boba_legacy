import json
import urllib3
import math
import textwrap
import struct

def lambda_handler(event, context):
  
    input = json.loads(event["body"])
    
    api_key = 'YOUR_API_KEY_HERE'
    
    print("DEBUG: from Geth:", input)

    param4HexString = input['params'][0]
    param4HexString = param4HexString.removeprefix("0x")

    params = textwrap.wrap(param4HexString, 64)
    
    str_length = int(params[2], 16) * 2
    request = params[3]
    bytes_object = bytes.fromhex(request[0:str_length])
    pair = bytes_object.decode("ASCII")

    requestURL = 'https://api.polygon.io/v1/last/crypto/' + pair + '?apiKey=' + api_key

    http = urllib3.PoolManager()
    resp = http.request("GET", requestURL)

    result = json.loads(resp.data)
    
    print("from endpoint:", result['last']['price'])
    
    price = result['last']['price'] * 100
    timestamp = result['last']['timestamp']
    
    res = '0x{0:0{1}x}'.format(int(64),64)
    res = res + '{0:0{1}x}'.format(int(price),64)
    res = res + '{0:0{1}x}'.format(int(timestamp),64)

    returnPayload = {
      'statusCode': 200,
      'body': json.dumps({
        "result": res
      })
    }

    print('return payload:', returnPayload)
    
    return returnPayload
