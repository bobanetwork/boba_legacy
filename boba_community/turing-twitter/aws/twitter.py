# https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/AWS_code/turing_oracle.py

import json
import urllib3
import certifi
import textwrap
import hashlib
from datetime import datetime

authorized_contract = None  # for open access

# TODO: Use AWS Secret Manager
TWITTER_BEARER_TOKEN = None # do not push


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
  # Create a PoolManager instance for sending requests.
  http = urllib3.PoolManager(ca_certs=certifi.where())

  # Send a POST request and receive a HTTPResponse object.
  error_reason = 0
  headers = {'Authorization': 'Bearer ' + TWITTER_BEARER_TOKEN}
  resp = http.request("GET",
                      "https://api.twitter.com/2/tweets/" + twitter_post_id + "?expansions=author_id&user.fields=created_at,public_metrics",
                      headers=headers)
  result = json.loads(resp.data)
  print("result: ", result)

  if "errors" in result:
    is_allowed_to_claim = False
    author_id = 0
    error_reason = 1 #result["errors"][0]["title"]  # use title for short error msg
  else:

    # The senderAddress is a usual walletAddress
    # The Boba Bubble is the string BOBA plus the uppercase first 9 of the MD5 hash of the walletAddress

    # bobaTag: Md5.hashStr(walletAddress.substring(2)) })
    # BT = 'BOBA' + bobaTag.substring(0,9).toUpperCase()

    # Step one - take the walletAddress, and generate the Boba Bubble
    BT = senderAddress # remove the leading Ox
    BT = hashlib.md5(BT.encode('utf-8')).hexdigest()   # need to check encoding etc
    BT = 'BOBA' + BT[0:9].upper()
    print("Boba Bubble based on input message sender", BT, senderAddress.encode('utf-8'), hashlib.md5(senderAddress.encode('utf-8')).hexdigest())
    print("BOBA: ", result["data"]["text"].lower(), BT.lower(), senderAddress, hashlib.md5(senderAddress.encode('ascii')).hexdigest())
    # Step 2 - confirm that the developer who tweeted the Boba Bubble is the same as this caller?
    has_posted = BT.lower() in result["data"]["text"].lower()
    author_id = result["data"]["author_id"]
    print("includes-users: ", result["includes"]["users"])

    # calc user account created difference to today
    usercreate_timediff_now = abs(datetime.now() - datetime.strptime(result["includes"]["users"][0]["created_at"],
                                                                     "%Y-%m-%dT%H:%M:%S.%fZ")).total_seconds()
    account_exists_long_enough = int(
      usercreate_timediff_now) > 172800  # account has to exist at least 48 hours (calculated in seconds)

    # calc if enough followers, etc..
    public_metrics = result["includes"]["users"][0]["public_metrics"]
    has_enough_follower = int(public_metrics["followers_count"]) > 5
    has_enough_tweets = int(public_metrics["tweet_count"]) > 2
    account_public_metrics_check = has_enough_follower and has_enough_tweets

    #if not account_exists_long_enough: error_reason = 2 #"Account too new"
    if not has_posted: error_reason = 3 #"Invalid tweet"
    #elif not has_enough_follower: error_reason = 4 #"Not enough follower"
    #elif not has_enough_tweets: error_reason = 5 #"Not enough tweets"

    # maybe try-catch for better error msgs (tweet not existing, ..)
    is_allowed_to_claim = has_posted # DISABLED FOR NOW: and account_exists_long_enough and account_public_metrics_check
    print("from endpoint:", has_posted, account_public_metrics_check, account_exists_long_enough, "Author: ", author_id,
          "User created at: ", usercreate_timediff_now, datetime.now(),
          datetime.strptime(result["includes"]["users"][0]["created_at"], "%Y-%m-%dT%H:%M:%S.%fZ"))

  # create return payload
  res = '0x' + '{0:0{1}x}'.format(int(96), 64)
  # 64 denotes the number of bytes in the `bytes` dynamic argument
  # since we are sending back 2 32 byte numbers, 2*32 = 64
  res = res + '{0:0{1}x}'.format(int(is_allowed_to_claim), 64)  # the result
  res = res + '{0:0{1}x}'.format(int(author_id), 64)  # the result
  res = res + '{0:0{1}x}'.format(int(error_reason), 64)  # the result

  #print("Original error: ", error_reason)
  #error_reason = int.from_bytes(error_reason.encode("ascii"), 'big')
  #print("EXTRA", error_reason)
  #res = res + '{0:0{1}x}'.format(int(error_reason), 64)
  #decoded_str = bytes.fromhex(res.removeprefix("0x")).decode("ascii")
  #print("DECODED: ", decoded_str)

  return res
