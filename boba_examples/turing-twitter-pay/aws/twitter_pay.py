import os
import json
import urllib3
import certifi
import textwrap
import hashlib
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

authorized_contract = None  # for open access

TWITTER_BEARER_TOKEN = os.environ.get('TWITTER_BEARER_TOKEN')  # is None if not found

# or...
# authorized_contract = '0xOF_YOUR_HELPER_CONTRACT' # to restrict access to only your smart contract


# NOTE: When taking the data payload from the original event for debugging then remove the first 64 bits!
def lambda_handler(event, context):
  print_logs = True
  if "logs" in event:
    print_logs = event["logs"]

  req_input = json.loads(event["body"])

  if print_logs:
    print("DEBUG: ", event)
    print("DEBUG: from Geth:", req_input)

  if authorized_contract is not None:
    # check authorisation if desired
    callerAddress = req_input['method']
    if callerAddress.lower() != authorized_contract.lower():
      returnPayload = {'statusCode': 403}
      if print_logs:
        print('return payload:', returnPayload)
      return returnPayload

  (sender_address, twitter_post_id) = get_request_params(req_input, print_logs=print_logs)

  result = load_tweet_status(twitter_post_id, print_logs=print_logs)

  (BT, is_allowed_to_claim, author_id, error_reason) = parse_api_response(result=result, sender_address=sender_address, print_logs=print_logs)

  # create return payload
  res = build_resp_payload(BT=BT, is_allowed_to_claim=is_allowed_to_claim, author_id=author_id,
                           error_reason=error_reason, print_logs=print_logs)

  returnPayload = {
    'statusCode': 200,
    'body': json.dumps({
      "result": res
    })
  }

  if print_logs:
    print('return payload:', returnPayload)

  return returnPayload


def get_request_params(req_input, print_logs=True):
  # get calling parameters
  paramsHexString = req_input['params'][0]
  paramsHexString = paramsHexString.removeprefix("0x")
  params = textwrap.wrap(paramsHexString, 64)

  if print_logs:
    print("Params: ", params)

  # the message sender
  sender_address = params[1]
  sender_address = sender_address[-40:64]
  # bytes_object = bytes.fromhex(request[-40]) # address
  # e.g. BOBA439E11DD4
  # id_to_verify = #"BOBA" + request[-40:9]  # bytes_object.decode("ASCII")

  # the tweet ID
  str_length_2 = int(params[3], 16) * 2  # the length of the tweetID field
  request_2 = params[4]  # the tweetID
  bytes_object_2 = bytes.fromhex(request_2[0:str_length_2])
  twitter_post_id = bytes_object_2.decode("ASCII")

  if print_logs:
    print("Sender to verify: ", sender_address, ", Twitter post id: ", twitter_post_id)
  return sender_address, twitter_post_id


def build_resp_payload(BT, is_allowed_to_claim, author_id, error_reason, print_logs=True):
  res = '0x' + '{0:0{1}x}'.format(int(128), 64)
  # 64 denotes the number of bytes in the `bytes` dynamic argument
  # since we are sending back 2 32 byte numbers, 2*32 = 64
  res = res + '{0:0{1}x}'.format(int(is_allowed_to_claim), 64)  # the result
  res = res + '{0:0{1}x}'.format(int(author_id), 64)  # the result
  res = res + '{0:0{1}x}'.format(int(error_reason), 64)  # the result

  BT = int.from_bytes(BT.encode("ascii"), 'big')
  res = res + '{0:0{1}x}'.format(int(BT), 64)

  if print_logs:
    print("Original boba tag: ", BT)
    print("EXTRA", BT)

  return res


def parse_api_response(result, sender_address, print_logs=True):
  BT = ""
  error_reason = 0

  if "errors" in result:
    is_allowed_to_claim = False
    author_id = "0"
    error_reason = 1  # result["errors"][0]["title"]  # use title for short error msg
  else:

    # The senderAddress is a usual walletAddress
    # The Boba Bubble is the string BOBA plus the uppercase first 9 of the MD5 hash of the walletAddress

    # bobaTag: Md5.hashStr(walletAddress.substring(2)) })
    # BT = 'BOBA' + bobaTag.substring(0,9).toUpperCase()

    # Step one - take the walletAddress, and generate the Boba Bubble
    BT = sender_address  # remove the leading Ox
    BT = hashlib.md5(BT.encode('utf-8')).hexdigest()  # need to check encoding etc
    BT = 'boba' + BT[0:9].lower()

    if print_logs:
      print("Boba Bubble based on input message sender", BT, sender_address.encode('utf-8'),
          hashlib.md5(sender_address.encode('utf-8')).hexdigest())
      print("BOBA: ", result["data"]["text"].lower(), BT.lower(), sender_address,
          hashlib.md5(sender_address.encode('ascii')).hexdigest())
    # Step 2 - confirm that the developer who tweeted the Boba Bubble is the same as this caller?
    has_posted = BT in result["data"]["text"].lower()
    author_id = result["data"]["author_id"]

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

    if not account_exists_long_enough: error_reason = 2  # "Account too new"
    if not has_posted:
      error_reason = 3  # "Invalid tweet"
    elif not has_enough_follower:
      error_reason = 4  # "Not enough follower"
    elif not has_enough_tweets:
      error_reason = 5  # "Not enough tweets"

    # maybe try-catch for better error msgs (tweet not existing, ..)
    is_allowed_to_claim = has_posted and account_exists_long_enough and account_public_metrics_check

    if print_logs:
      print("from endpoint:", has_posted, account_public_metrics_check, account_exists_long_enough, "Author: ", author_id,
          "User created at: ", usercreate_timediff_now, datetime.now(),
          datetime.strptime(result["includes"]["users"][0]["created_at"], "%Y-%m-%dT%H:%M:%S.%fZ"))

  return BT, is_allowed_to_claim, author_id, error_reason


def load_tweet_status(twitter_post_id, print_logs=True):
  # Create a PoolManager instance for sending requests.
  http = urllib3.PoolManager(ca_certs=certifi.where())

  # Send a POST request and receive a HTTPResponse object.
  headers = {'Authorization': 'Bearer ' + TWITTER_BEARER_TOKEN}
  resp = http.request("GET",
                      "https://api.twitter.com/2/tweets/" + twitter_post_id + "?expansions=author_id&user.fields=created_at,public_metrics",
                      headers=headers)
  result = json.loads(resp.data)

  if print_logs:
    print("result: ", result)

  return result
