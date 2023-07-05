# https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/AWS_code/turing_oracle.py

import json
#import urllib3
#import certifi
import time
import textwrap
import hashlib
import os
from datetime import datetime

authorized_contract = None  # for open access


# or...
# authorized_contract = '0xOF_YOUR_HELPER_CONTRACT' # to restrict access to only your smart contract

# NOTE: When taking the data payload from the original event for debugging then remove the first 64 bits!
def lambda_handler(event, context):
  print("DEBUG: ", event)

  input = json.loads(event["body"])
  print("DEBUG: from Geth:", input)

  if authorized_contract is not None:
    # check authorisation if desired
    callerAddress = input['method']
    if callerAddress.lower() != authorized_contract.lower():
      returnPayload = {'statusCode': 403}
      print('return payload:', returnPayload)
      return returnPayload

  # get calling parameters
  paramsHexString = input['params'][0]
  paramsHexString = paramsHexString.removeprefix("0x")
  params = textwrap.wrap(paramsHexString, 64)

  # 3 parameter example:
  # ['0000000000000000000000000000000000000000000000000000000000000120', '0000000000000000000000000000000000000000000000000000000000000060',
  # '00000000000000000000000000000000000000000000000000000000000000a0', '00000000000000000000000000000000000000000000000000000000000000e0',
  # '0000000000000000000000000000000000000000000000000000000000000006', '737472696e670000000000000000000000000000000000000000000000000000',
  # '0000000000000000000000000000000000000000000000000000000000000008', '67656e7265733a30000000000000000000000000000000000000000000000000',
  # '000000000000000000000000000000000000000000000000000000000000001d', '6172746973742f3158796f347538755843315a6d4d706174463035504a000000']

  # 2 parameter example:
  # ['00000000000000000000000000000000000000000000000000000000000000c0', '0000000000000000000000000000000000000000000000000000000000000040',
  # '0000000000000000000000000000000000000000000000000000000000000080', '0000000000000000000000000000000000000000000000000000000000000008',
  # '67656e7265733a30000000000000000000000000000000000000000000000000', '000000000000000000000000000000000000000000000000000000000000001d',
  # '6172746973742f3158796f347538755843315a6d4d706174463035504a000000']

  # 1 parameter example:
  # 0000000000000000000000000000000000000000000000000000000000000060
  # 0000000000000000000000000000000000000000000000000000000000000020
  # 000000000000000000000000000000000000000000000000000000000000000c
  # 476574466f6c6c6f776572730000000000000000000000000000000000000000

  # the input to the contract is
  # _msgSender(), twitterPostID_
  # address payable recipient_, string calldata twitterPostID_
  #
  # But we also have to make sure that the _msgSender address is the same one
  # that corresponds to the Boba Bubble
  #

  print("Params: ", params)
  # str_length_1 = int(params[1], 16) * 2

  # the message sender
  senderAddress = params[1]
  senderAddress = senderAddress[-40:64]
  # bytes_object = bytes.fromhex(request[-40]) # address
  # e.g. BOBA439E11DD4
  # id_to_verify = #"BOBA" + request[-40:9]  # bytes_object.decode("ASCII")

  # the tweet ID
  str_length_2 = int(params[3], 16) * 2 # the length of the tweetID field
  request_2 = params[4]                 # the tweetID
  bytes_object_2 = bytes.fromhex(request_2[0:str_length_2])
  twitter_post_id = bytes_object_2.decode("ASCII")

  print("Sender to verify: ", senderAddress, ", Twitter post id: ", twitter_post_id)

  res = load_tweet_status(senderAddress, twitter_post_id)

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


def load_tweet_status(senderAddress, twitter_post_id):

  # Send a POST request and receive a HTTPResponse object.
  error_reason = 0
  file_name = "/tmp/developers.json"
  resp = None
  is_allowed_to_claim = False

  # create dev json if not existent
  if not os.path.isfile(file_name) or not os.access(file_name, os.R_OK):
    with open(file_name, "w") as new_file:
      new_file.write(json.dumps({}))

  author_id = twitter_post_id
  with open(file_name) as f:
    resp = f.read()
    resp = json.loads(resp.encode("utf-8"))

    lastClaim = None
    if twitter_post_id in resp:
      lastClaim = resp[twitter_post_id]

    currTime = time.time()
    if (lastClaim is None or (lastClaim is not None and (currTime - lastClaim) > 86400)):
      is_allowed_to_claim = True
    else:
       error_reason = 1


    resp[twitter_post_id] = currTime



  with open(file_name, "w") as outfile:
    outfile.write(json.dumps(resp, indent=4))


  # create return payload
  res = '0x' + '{0:0{1}x}'.format(int(128), 64)
  # 64 denotes the number of bytes in the `bytes` dynamic argument
  # since we are sending back 2 32 byte numbers, 2*32 = 64
  res = res + '{0:0{1}x}'.format(int(is_allowed_to_claim), 64)  # the result
  res = res + '{0:0{1}x}'.format(int(author_id), 64)  # the result
  res = res + '{0:0{1}x}'.format(int(error_reason), 64)  # the result

  print("Request ended with: ", is_allowed_to_claim, author_id, error_reason)

  BT = "BOBAAFEC58E77" #random for now
  print("Original boba tag: ", BT)
  BT = int.from_bytes(BT.encode("ascii"), 'big')
  print("EXTRA", BT)
  res = res + '{0:0{1}x}'.format(int(BT), 64)
  #decoded_str = bytes.fromhex(res.removeprefix("0x")).decode("ascii")
  #print("DECODED: ", decoded_str)

  return res
