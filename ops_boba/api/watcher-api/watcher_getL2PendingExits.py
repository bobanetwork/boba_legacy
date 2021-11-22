import json
import yaml
import pymysql
import boto3
import string
import random
import time
import requests
import redis

def watcher_getL2PendingExits(event, context):

  # Read YML
  with open("env.yml", 'r') as ymlfile:
    config = yaml.load(ymlfile)

  # Get MySQL host and port
  endpoint = config.get('RDS_ENDPOINT')
  user = config.get('RDS_MYSQL_NAME')
  dbpassword = config.get('RDS_MYSQL_PASSWORD')
  dbname = config.get('RDS_DBNAME')

  con = pymysql.connect(endpoint, user=user, db=dbname,
                        passwd=dbpassword, connect_timeout=5)

  exitPayload = []

  statusCode = 201
  with con:
    try:
      cur = con.cursor()
      cur.execute("""SELECT exitL2.hash, exitL2.blockHash, exitL2.blockNumber,
        exitSender, exitTo, exitToken, exitAmount, exitReceive, fastRelay, status,
        block.timestamp
        FROM exitL2
        LEFT JOIN block
        on exitL2.blockNumber = block.blockNumber
        WHERE status=%s""", ('pending')
      )
      payload = cur.fetchall()
      for eachPayload in payload:
        [txHash, blockHash, blockNumber, exitSender, exitTo, exitToken, exitAmount, exitReceive, fastRelay, status, timestamp] = eachPayload
        exitPayload.append({
          "hash": txHash, "blockHash": blockHash, "blockNumber": blockNumber,
          "exitSender": exitSender, "exitTo": exitTo, "exitToken": exitToken,
          "exitAmount": exitAmount, "exitReceive": exitReceive, "fastRelay": fastRelay,
          "status": status, "timestamp": timestamp
        })
    except Exception as e:
      statusCode = 500
      print("error: ", e)

  con.close()

  return returnReponse(statusCode, exitPayload)

def returnReponse(statusCode, body):
    return {
    "statusCode": statusCode,
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
    "body": json.dumps(body),
  }
