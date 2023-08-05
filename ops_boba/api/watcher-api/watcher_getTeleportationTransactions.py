import json
import yaml
import pymysql
import boto3
import string
import random
import time
import requests
import redis

def watcher_getTeleportationTransactions(event, context):

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
      cur.execute("""SELECT * FROM teleportation
        WHERE `depositSender`=%s OR `disburseReceiver`=%s ORDER BY CAST(depositBlockNumber as unsigned) DESC LIMIT %s OFFSET %s""", (address, address, toRange - fromRange, fromRange))
      transactionsDataRaw = cur.fetchall()

      for transactionDataRaw in transactionsDataRaw:

        transactionData.append({
          "depositHash": transactionDataRaw[0],
          # not returning blockHash, not needed
          "depositBlockNumber": int(transactionDataRaw[2]),
          "depositSender": transactionDataRaw[3],
          "depositChainId": int(transactionDataRaw[4]),
          "depositId": int(transactionDataRaw[5]),
          "depositToken": transactionDataRaw[6],
          "depositAmount": transactionDataRaw[7],
          "disburseHash": transactionDataRaw[8],
          # not returning blockHash, not needed
          "disburseBlockNumber": int(transactionDataRaw[10]) if transactionDataRaw[10] is not None else None,
          "disburseReceiver": transactionDataRaw[11],
          "disburseChainId": int(transactionDataRaw[12]) if transactionDataRaw[12] is not None else None,
          "disburseToken": transactionDataRaw[13],
          "lastUpdatedTimestamp": int(transactionDataRaw[14]),
          "status": transactionDataRaw[15],
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
