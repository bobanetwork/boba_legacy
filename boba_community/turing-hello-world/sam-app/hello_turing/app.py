import json
import urllib3
import textwrap

def lambda_handler(event, context):

    input = json.loads(event["body"])

    print("DEBUG: from Geth:", input)

    param4HexString = input['params'][0]
    param4HexString = param4HexString.removeprefix("0x")

    #break the string into length 64 chunks
    params = textwrap.wrap(param4HexString, 64)

    var_1  = float(int(params[0], 16))
    var_2  = float(int(params[1], 16))

    print('DEBUG: Inputs var_1:', var_1, ' var_2:', var_2)

    # do your fancy math
    theSum = var_1 + var_2
    res = '0x{0:0{1}x}'.format(int(32),64)
    result = res + '{0:0{1}x}'.format(int(theSum),64) #the actual result
    
    print("RESULT:", result)

    returnPayload = {
      'statusCode': 200,
      'body': json.dumps({
        "result": result
      })
    }

    print('returning:', returnPayload)
    
    return returnPayload