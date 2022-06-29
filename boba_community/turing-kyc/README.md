---
description: Turing Example - OnChain KYC
---

## What is it?
Regulation is coming, there is no doubt. Some examples: 

* The famous Otherside contract from YugaLabs required KYC on launch
* Some DeFi applications will be required to add KYC as well, depending on how regulations progress (EU, US, ..).

DeFi apps currently face a huge problem when trying to comply with those new regulations. But the good news are, Turing can help with this! 

With Turing you can build your own KYC gatekeeper for specific smart contract functions with ease. We have written a simple `modifier` for that, which does the check for you. All you need to do, is checking a wallet's KYC status on the AWS backend and return if the wallet is allowed to call the smart contract function. 

## Basics

Inside the folder, run `yarn install`. 

### 0. Make sure that your have *AWS SAM* installed. 

You can find instructions [here](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html). Assuming you have the AWS CLI and have everything set up correctly, installing SAM should just take two commands. On a Mac with `homebrew`, for example,

```bash
$ brew tap aws/tap
$ brew install aws-sam-cli
```

### 1. Local testing of the example server

This assumes you have `python-lambda-local` installed. If not, install it via `pip3 install python-lambda-local`.

```bash
$ yarn start:lambda
```

If everything is working correctly, you will see:

```
{'statusCode': 200, 'body': '{"result": "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001"}'}
```

### 2. Local testing of the example SAM deployment

```bash
$ yarn start:lambda-sam
```

This will build and run the server image. It will ingest example inputs, as above.
