#### Setup the environment

Make sure you have python >= 3.7 and Nodejs >= 14

```bash
python3 -m venv env
```
This will create a python virtual environment.
After creating the virtual environment, you need to activate it using below command
```bash
source env/bin/activate
```
Now the environment has been activated

Add a file `env-mainnet.yml` follow fields
```yaml
ROLE: ROLE
SECURITYGROUP: SECURITYGROUP
SUBNET_ID_1: SUBNET_ID_1
SUBNET_ID_2: SUBNET_ID_2
SECURITY_GROUPS: SECURITY_GROUPS
WEB3_URL: WEB3_URL
BOBA_ADDRESS: BOBA_ADDRESS
DEPLOYER_ADDRESS: DEPLOYER_ADDRESS
```

#### Install the required dependencies
```bash
pip install -r requirements.txt
```

#### Run the code in local
```bash
WEB3_URL={url} BOBA_ADDRESS={address} DEPLOYER_ADDRESS={address} python token_getSupply.py
WEB3_URL={url} BOBA_ADDRESS={address} DEPLOYER_ADDRESS={address} python token_getCirculatingSupply.py
```
After the code runs successfully, you will find output result in console.

#### Deploy to AWS
- Install AWS cli [here](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html "AWS cli installation guide")
- Install serverless cli [here](https://www.serverless.com/framework/docs/getting-started/  "Serverless cli installation guide")
- Install serverless plugin
  ```bash
  npm install
  ```
- Deploy by sh file
  ```bash
  STAGE=mainnet sh ./deploy.sh
  ```
