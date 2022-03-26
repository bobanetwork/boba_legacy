# Turing KYC example

## Basics

Inside the folder, run `yarn install`. You will need Docker. 

1. Make sure that your have *AWS SAM* installed. 

You can find instructions [here](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html). Assuming you have the AWS CLI and have everything set up correctly, installing SAM sohlud just take two commands. On a Mac with `homebrew`, for example,

```bash
brew tap aws/tap
brew install aws-sam-cli
```

2. Deploying the example backend

```bash
yarn start:lambda-sam
```

This will build the server image. You may need to install `spotipy` (`pip3 install spotipy`)? Now sure, but that's what breaking AWS SAM script right now... 