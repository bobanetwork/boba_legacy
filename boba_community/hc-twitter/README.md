# Turing Faucet

Goerli deployment:
* Helper contract deployed as `0xd7CcDeCE06b271667ce4de5931e67fc90E108283`
* TwitterClaim contract deployed on `0x4E98bAbe5364452cD02FC8E0AD7d9E526B68a5D6`


## Basics

Inside the folder, run `yarn install`. You will also need Docker.

0. Make sure that your have *AWS SAM* installed.

You can find instructions [here](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html). Assuming you have the AWS CLI and have everything set up correctly, installing SAM should just take two commands. On a Mac with `homebrew`, for example,

```bash
$ brew tap aws/tap
$ brew install aws-sam-cli
```

1. Local testing of the example server

This assumes you have `python-lambda-local` installed. If not, install it via `pip3 install python-lambda-local`.

```bash
$ yarn start:lambda
```

If everything is working correctly, you will see:

```
{'statusCode': 200, 'body': '{"result": "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001"}'}
```

2. Local testing of the example SAM deployment

```bash
$ yarn start:lambda-sam
```

This will build and run the server image. It will ingest example inputs, as above.
