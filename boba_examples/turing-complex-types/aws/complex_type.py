# https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/AWS_code/turing_oracle.py

import json
import urllib3
import certifi
import textwrap
from eth_abi import encode_abi, decode_abi
from web3 import Web3

authorized_contract = None  # for open access


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

    print("Params: ", params)
    # str_length_1 = int(params[1], 16) * 2

    # the message sender
    senderAddress = params[0]
    senderAddress = senderAddress[-40:64]

    # the student ID
    str_length_2 = int(params[2], 16) * 2  # the length of the studentID field
    request_2 = params[3]  # the studentID
    bytes_object_2 = bytes.fromhex(request_2[0:str_length_2])
    student_id = bytes_object_2.decode("ASCII")

    print("Wallet: ", senderAddress, ", Id: ", student_id)

    res = load_data(senderAddress, student_id)

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


def load_data(senderAddress, student_id):
    # Create a PoolManager instance for sending requests.
    http = urllib3.PoolManager(ca_certs=certifi.where())

    # TODO: Send a POST request and receive a HTTPResponse object.
    # error_reason = 0
    # headers = {'Authorization': 'Bearer ' + TWITTER_BEARER_TOKEN}
    # resp = http.request("GET",
    #                    "https://api.twitter.com/2/tweets/" + student_id + "?expansions=author_id&user.fields=created_at,public_metrics",
    #                    headers=headers)
    # result = json.loads(resp.data)
    # print("result: ", result)

    # create return payload
    some_numbers = [5, 8]
    some_text_array = ["a", "b"]
    some_text = "awesome"

    encoded_str = encode_abi(['uint256[]', 'string[]', 'string'], [some_numbers, some_text_array, some_text])
    print("ENCODED: ", encoded_str)

    # Just an internal test for your logs (can be safely removed)
    decoded = decode_abi(['uint256[]', 'string[]', 'string'], encoded_str)
    print("DECODED: ", decoded)

    # Transform byte-array to string.
    res = Web3.toHex(encoded_str)
    print("RES: ", res)

    return res
