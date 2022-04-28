# https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/AWS_code/turing_oracle.py

import json
import urllib3
import textwrap

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
    print("Params: ", params)
    str_length_1 = int(params[2], 16) * 2

    request = params[3]
    bytes_object = bytes.fromhex(request[0:str_length_1])
    wallet_addr = bytes_object.decode("ASCII")

    print("Decoded wallet address: ", wallet_addr)

    res = load_kyc_status(wallet_addr)

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


def load_kyc_status(wallet_address):
    # specify your API endpoint here
    # TODO: wallet_address
    request_url = 'localhost' # TODO: Adapt to real api

    # Create a PoolManager instance for sending requests.
    http = urllib3.PoolManager()

    # Send a POST request and receive a HTTPResponse object.
    # TODO resp = http.request("GET", request_url)
    # TODO result = json.loads(resp.data)
    extracted_value = 1 # TODO result['isKYCed'] # TODO: Adapt to real Api response

    print("from endpoint:", extracted_value)

    # create return payload
    res = '0x' + '{0:0{1}x}'.format(int(32), 64)
    # 64 denotes the number of bytes in the `bytes` dynamic argument
    # since we are sending back 2 32 byte numbers, 2*32 = 64
    res = res + '{0:0{1}x}'.format(int(extracted_value), 64)  # the result

    return res
