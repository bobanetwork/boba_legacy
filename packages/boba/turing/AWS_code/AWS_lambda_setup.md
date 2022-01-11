# AWS Lambda setup notes

## Lambda > Functions

Go to Amazon **Lambda** web console
Click `Create function` (top right)
Select `author from scratch`
Give it a good name (e.g. basic_math)
Select Runtime: Node.js 14.x (or Python)
Click `Create function`

## Add a simple test

Set up a basic test: `Test > Configure test event`

## Add web API

Go to the Application Services section of the Amazon **API Gateway** web console
Select `Get Started`. Chose HTTP API.
Click `Add integration` - Lambda - use same region; select your Lambda function from the dropdown.
Click `Create`.
This will give you an Invoke URL.

## Test the system

Go back to Amazon **Lambda** web console
In the function overview, you will now see an API Gateway trigger
When you click the API endpoint, you should see a `hello world` string. 

## Add Math

Change the index.js code to

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

## Turing Simple Math

The Basic Math code is in `turing/AWS_code/turing_basicMath.py`. To test it from your terminal, run:

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

## Turing StableSwap example

Since AWS Lambda can run `Python 3.9` you can take advantage of Python's full math support. Most obviously, you can work with floats, do not need to think about nearest integer division (`//`) and have the usual `sqrt()` and `math.pow()` functions to draw upon. The StableSwap code is in `turing/AWS_code/turing_stableSwap.py`. To test it from your terminal, run:

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

So in this example, putting in `5.0` token 'X' would give you `4.227` token 'Y'. You can compare and contrast the results you would get by running the calculation on the Ethereum EVM compared to on AWS by changing `"sol":"true"` to `"sol":"false"`.  
