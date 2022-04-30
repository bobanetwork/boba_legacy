
## Step 1: Setting up a suitable endpoint

Let's use AWS Lambda to set up an python endpoint for you. The `app.py` takes an http POST event, extracts two numbers, adds them, and returns the result in a way that solidity can understand. 

```python

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

```

You can deploy this function to AWS Lambda. We've created a AWS SAM template which is ready to use. You will need an [AWS developer account and the AWS cli](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html) and [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install-mac.html). Commands need to be executed in the same directory as `template.yaml`.

```bash

# Configure your AWS CLI if needed
$ aws configure

# Install SAM for your platform - see above for SAM documention link
# On Mac, for example,
$ brew tap aws/tap
$ brew install aws-sam-cli

$ sam build --use-container
$ sam deploy --guided

```

Accept all defaults, but answer yes to `HelloTuringFunction may not have authorization defined, Is this okay? [y/N]: `. This gives you a live public Lambda endpoint that accepts two numbers and sums them. 

```
CloudFormation outputs from deployed stack
----------------------------------------------------------------------------------------------------------------
Outputs                                                                                                                                                                                          
----------------------------------------------------------------------------------------------------------------
Key                 HelloTuringApi                                                                                                                                                               
Description         API Gateway endpoint URL for Prod stage for Hello Turing function                                                                                                            
Value               https://izy1w9anbj.execute-api.us-east-1.amazonaws.com/Prod/                                                                                                                 
                                                                               
----------------------------------------------------------------------------------------------------------------

Successfully created/updated stack - HelloTuring in us-east-1

```

## Step 2: Testing your endpoint

You can test this endpoint with `curl`. Your endpoint will have a different URL, of course, so please update that.

```bash
curl -X POST \
    'https://izy1w9anbj.execute-api.us-east-1.amazonaws.com/Prod/' \
    -H 'content-type: application/json' \
    -d '{"jsonrpc": "2.0", "id": 1, "method": "0xd6e1afe5cA8D00A2EFC01B89997abE2De47fdfAf", "params": ["0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000022"]}'

# expected result

{"result": "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000042"}% 

```

Note the special way that the inputs (two numbers) flow to the endpoint:

```bash
-d '{"jsonrpc": "2.0", "id": 1, "method": "0xd6e1afe5cA8D00A2EFC01B89997abE2De47fdfAf", "params": ["0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000022"]}'
```

This emulates how the data will be sent to the endpoint from the Geth. 

## Step 3: Deploy a solidity smart contract using this endpoint

NEED TO Write this part. When you are done, save the contract address. You will need it soon

## Step 4: Authorize and fund the turinghelper

You can do this online at: 

## Step 5: Test the complete system

To write....
