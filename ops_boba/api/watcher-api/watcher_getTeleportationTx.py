import json
import yaml
import pymysql


def watcher_getTeleportationTx(event, context):
    # Parse incoming event
    body = json.loads(event["body"])
    address = body.get("address")
    fromRange = int(body.get("fromRange"))
    toRange = int(body.get("toRange"))

    # Read YML
    with open("env.yml", 'r') as ymlfile:
        config = yaml.load(ymlfile, Loader=yaml.FullLoader)

    # Get MySQL host and port
    endpoint = config.get('RDS_ENDPOINT')
    user = config.get('RDS_MYSQL_NAME')
    dbpassword = config.get('RDS_MYSQL_PASSWORD')
    dbname = config.get('RDS_DBNAME')

    con = pymysql.connect(host=endpoint, user=user, db=dbname,
                          passwd=dbpassword, connect_timeout=5)

    transactionData = []
    with con.cursor() as cur:
        try:
            cur.execute("""SELECT
        sourceChainId, toChainId, hash, blockHash, blockNumber, txFrom, txTo, amount, event
        FROM teleportation
        WHERE `txFrom`=%s ORDER BY CAST(blockNumber as unsigned) DESC LIMIT %s OFFSET %s""", (address, toRange - fromRange, fromRange))
            transactionsDataRaw = cur.fetchall()
            for transactionDataRaw in transactionsDataRaw:
                transactionData.append({
                    "sourceChainId": transactionDataRaw[0],
                    "toChainId": transactionDataRaw[1],
                    "hash": transactionDataRaw[2],
                    "blockHash": transactionDataRaw[3],
                    "blockNumber": transactionDataRaw[4],
                    "txFrom": transactionDataRaw[5],
                    "txTo": transactionDataRaw[6],
                    "amount": transactionDataRaw[7],
                    "event": transactionDataRaw[8]
                })

        except Exception as e:
            print(e)
            transactionData = []

    con.close()

    response = {
        "statusCode": 201,
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
        "body": json.dumps(transactionData),
    }
    return response
