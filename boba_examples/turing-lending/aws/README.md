---
description: Learn how to set up a simple endpoint for Turing to interact with
---

Turing can interact with any computer with an API. Examples include dozens of Google Cloud Services and AWS Services. Here are some basic instructions for using an AWS Lambda endpoint. The generic process for setting up an **AWS Lambda endpoint** is described [here](https://docs.aws.amazon.com/lambda/latest/dg/getting-started-create-function.html) but you can also just follow along with this writeup. The generic process for setting up a **Google Cloud Function** is described [here](https://cloud.google.com/functions/) - the example javascript and Python code provided below also works on GCF of course. 

## Basic Setup

Set up an AWS account if you do not have one. Go to the **Amazon Lambda** web console. Click `Create function` (top right). Select `Author from scratch`.
Give it a good name (e.g. `basic_math`). Select Runtime: Node.js 14.x (for running javascript code) or Python 3.9 (for running Python code). Leave everything else as is and click `Create function` (bottom right).

## Add a simple test

Set up a basic test: `Test > Configure test event`, name the test (e.g. `basic_math_test`), then `Create`.

## Add web API

Go to the Application Services section of the Amazon **API Gateway** web console - you can go there directly by searching for `API Gateway` in the service search bar (top left). Select `Get Started` or `Create API`. Chose HTTP API, `Build`, then `Add integration` - select Lambda from the dropdown - use same region; select your Lambda function (`basic_math`) from the dropdown. Click `Create`. This will give you an Invoke URL. That's what you will provide as one of the parameters for your Turing calls. 

## Test the system

Go back to the **Lambda** web console. In the `Function overview`, you will now see an API Gateway trigger. Click it, and then click the `Triggers>API endpoint: https://...`. A new browser tab will open and you will see the string `"Hello from Lambda!"`. The basic system is now in place and working. Next, add some math, or whatever functionality you need. 

## Turing StableSwap example

See `./turing_stableSwap.py` for deployable stableSwap code. Since AWS Lambda can run `Python 3.9` you can take advantage of Python's full math support. Most obviously, you can work with floats, do not need to think about nearest integer division (`//`) and have the usual `sqrt()` and `math.pow()` functions to draw upon. The StableSwap code is in [`./AWS_code/turing_stableSwap.py`](./turing_stableSwap.py). To test it from your terminal, run:

```bash
#StableSwap Curl Test
#run from your terminal 
curl -X POST \
    'https://i9iznmo33e.execute-api.us-east-1.amazonaws.com/stableSwap' \
    -H 'content-type: application/json' \
    -d '{"L_x":"10.0","L_y":"10.0","A":"1.00","x_in":"5.00","sol":"true"}'

#returns
{"x_in": 5.0, "y_out": 4.227083333333334, "x_new": 15.0, "y_prev": 10.0, "y_new": 5.772916666666666, "sol": true}%
```

So in this example, putting in `5.0` token 'X' would give you `4.227` token 'Y'.

## Turing Simple Math Example

Assuming you set up a `Node.js` handler, change the `index.js` code to

```javascript
// basic_math
exports.handler = async (event) => {
    
    //caller provides, for example, two floats to add or multiply
    const input = JSON.parse(event.body)
    
    const float1 = parseFloat(input["key1"])
    const float2 = parseFloat(input["key2"])
    
    const sum = float1 + float2
    const mul = float1 * float2
    
    console.log("Sum of parameters:",sum)
    console.log("Product of parameters:",mul)
    
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            sum: sum,
            mul: mul
        }),
    }
    
    return response
}
```

This gives you a Lambda endpoint that accepts two numbers and sums and multiplies them. This endpoint is already deployed. To test it from your terminal, run:

```bash
#Basic Math Curl Test
#run from your terminal 
curl -X POST \
    'https://i9iznmo33e.execute-api.us-east-1.amazonaws.com/basic_math' \
    -H 'content-type: application/json' \
    -d '{"key1":"0.73","key2":"9.62"}'

#returns
{"sum":10.35,"mul":7.022599999999999}%
```

## Turing Price Feed example

See `./turing_oracle.py` for deployable price feed API query code. Depending on the details of the API you are interating with, you will need to make minor changes. 

```bash
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

```
