
## Introduction to Turing

## Preparation

Spin up a local test stack. Duplicate `env.example`, make changes if needed, and then save as `.env`. Finally, build and test the contracts.

```bash

$ yarn build

```

## Basic Usage



## Example of AWS Lambda code for DeFi

### Trivial Add and Multiply

Calling 

```bash

curl -X POST \
'https://kkfpq0g9y0.execute-api.us-west-1.amazonaws.com/default/turing_add' \
-H 'content-type: application/json' \
-d '{"key1":"0.73","key2":"9.62"}'

```

returns

```bash
{"sum":10.35,"mul":7.022599999999999}
```

You can see how AWS Lambda is configured at `Lambda > Functions > turing_add`. The function is implement in javascript:

```javascript

exports.handler = async (event) => {
    
    //caller provides two floats to add or multiply in body
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
    };
    return response;
};

```

### Stableswap re-parametrisation 

Calling 

```bash

curl -X POST \
'https://b8ooz5uu6b.execute-api.us-west-1.amazonaws.com/default/turing_stableswap' \
-H 'content-type: application/json' \
-d '{"x_in":"39.9595","L_x":"300.92","L_y":"100.87","A":"9.73"}'

````

will return new values for `x` and `y`:

```bash
{"x_in": 39.9595, "x": 340.8795, "y": 27.0, "A": 9.73}%
```

The code that is being invoked at AWS is:

```python

def lambda_handler(event, context):

    input = json.loads(event["body"])
    
    # Prepare the inputs
    x_in = float(input["x_in"])
    L_x = float(input["L_x"])
    L_y = float(input["L_y"])
    a = float(input["A"])
    
    print("DEBUG: Inputs - x_in:",x_in, ' L_x:', L_x, ' L_y:', L_y, ' A:', a)
    
    # Do the math
    initializeLiquidity(L_x,L_y)
    
    changeA(a)
    
    swap_x(x_in)
    
    return {
        'statusCode': 200,
        'body': json.dumps({"x_in":x_in,"x":x,"y":y,"A":A})
    }

```

## Odds and Ends

This subtree was merged from the github.com:enyalabs/omgx_turing repo. It contains test code corresponding to the modified l2geth implementation in this branch.

For the classifier to work a python environment is needed. The required packages are in `requirements.txt`, the python version to use is 3.6.7. 

After activitating the conda environment run

```bash
$ python app.py
```
in the `classifer` directory.




