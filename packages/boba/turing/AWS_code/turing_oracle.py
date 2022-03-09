import json
import urllib3
import math
import textwrap
import struct

api_key = 'YOUR_API_KEY'

authorized_contract = None # for open access
# or...
# authorized_contract = '0xOF_YOUR_HELPER_CONTRACT' # to restrict access to only your smart contract
  
def lambda_handler(event, context):
  
  input = json.loads(event["body"])
  print("DEBUG: from Geth:", input)
  
  # check authorisation if desired
  callerAddress = input['method']
  
  if authorized_contract is not None :  
    if callerAddress.lower() != authorized_contract.lower() :
      returnPayload = {'statusCode': 403}
      print('return payload:', returnPayload)
      return returnPayload    
  
  # get calling parameters    
  paramsHexString = input['params'][0]
  paramsHexString = paramsHexString.removeprefix("0x")
  params = textwrap.wrap(paramsHexString, 64)
  
  # 0000000000000000000000000000000000000000000000000000000000000060
  # 0000000000000000000000000000000000000000000000000000000000000020
  # 0000000000000000000000000000000000000000000000000000000000000007
  # 4254432f55534400000000000000000000000000000000000000000000000000 BTC-USD, for example
    
  str_length = int(params[2], 16) * 2
  
  request = params[3]
  bytes_object = bytes.fromhex(request[0:str_length])
  pair = bytes_object.decode("ASCII")
  
  # specify your API endpoint here
  requestURL = 'https://api.polygon.io/v1/last/crypto/' + pair + '?apiKey=' + api_key
    
  # Create a PoolManager instance for sending requests.
  http = urllib3.PoolManager()

  # Send a POST request and receive a HTTPResponse object.
  resp = http.request("GET", requestURL)

  print(resp.data)
    
  result = json.loads(resp.data)
    
  print("from endpoint:", result['last']['price'])
    
  price = result['last']['price'] * 100
  timestamp = result['last']['timestamp']
    
  # create return payload
  res = '0x'+ '{0:0{1}x}'.format(int(       64),64) 
  #64 denotes the number of bytes in the `bytes` dynamic argument
  #since we are sending back 2 32 byte numbers, 2*32 = 64
  res = res + '{0:0{1}x}'.format(int(    price),64) #the price
  res = res + '{0:0{1}x}'.format(int(timestamp/1000),64) #the timestamp
    
  print("res:", res)

  # example res: 
  # 0x
  # 0000000000000000000000000000000000000000000000000000000000000040
  # 0000000000000000000000000000000000000000000000000000000000418b95
  # 0000000000000000000000000000000000000000000000000000017e60d3b45f

  returnPayload = {
    'statusCode': 200,
    'body': json.dumps({
      "result": res
    })
  }

  print('return payload:', returnPayload)
    
  return returnPayload

