try:
    import unzip_requirements
except ImportError:
    pass
import json
import os
from json import JSONDecodeError
from web3 import Web3


def error_response(err_message: str):
    return {
        "statusCode": 500,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": True,
            "Strict-Transport-Security": "max-age=63072000; includeSubdomains; preload",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "same-origin",
            "Permissions-Policy": "*",
        },
        "body": err_message,
    }


def token_getCirculatingSupply(event, context):
    web3_url: str = os.environ.get('WEB3_URL')
    deployer_address: str = os.environ.get('DEPLOYER_ADDRESS')
    boba_address: str = os.environ.get('BOBA_ADDRESS')

    if web3_url is None or deployer_address is None or boba_address is None:
        return error_response('Missing params!')

    web3 = Web3(Web3.HTTPProvider(web3_url))

    try:
        with open("abi.json") as f:
            abi = json.load(f)
    except FileNotFoundError:
        return error_response('ABI json file not found!')
    except JSONDecodeError:
        return error_response('ABI file is not json file!')

    try:
        contract = web3.eth.contract(address=boba_address, abi=abi)
        total_supply = contract.functions.totalSupply().call()
        token_balance = contract.functions.balanceOf(deployer_address).call()
        circulating_supply = Web3.fromWei(total_supply - token_balance, unit='ether')
    except Exception as ex:
        return error_response(str(ex))

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": True,
            "Strict-Transport-Security": "max-age=63072000; includeSubdomains; preload",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "same-origin",
            "Permissions-Policy": "*",
        },
        "body": str(circulating_supply),
    }


if __name__ == '__main__':
    print(token_getCirculatingSupply(None, None))
