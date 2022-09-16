import json
import yaml
import pymysql


def watcher_getLayerZeroTransaction(event, context):
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
        chainID, targetChainID, hash, blockNumber, amount, event, timestamp, reference
        FROM layerZeroTx
        WHERE `crossTxFrom`=%s AND blockNumber <= %s AND blockNumber >= %s ORDER BY blockNumber""", (address, toRange, fromRange))
            transactionsDataRaw = cur.fetchall()
            print("total", len(transactionsDataRaw))
            for transactionDataRaw in transactionsDataRaw:
                print("FOUND")
                transactionData.append({
                    "tx_hash": transactionDataRaw[2],
                    "amount": transactionDataRaw[4],
                    "event_type": transactionDataRaw[5],
                    "destination_chain": transactionDataRaw[1],
                    "timestamp": transactionDataRaw[6],
                    "block_number": transactionDataRaw[3],
                    "reference": transactionDataRaw[7]
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
