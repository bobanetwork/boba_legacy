import json
import yaml
import pymysql
import boto3
import string
import random
import time
import requests
import redis

def watcher_sendCrossDomainMessage(event, context):

  # Parse incoming event
  body = json.loads(event["body"])
  txHash = body.get('hash')
  block = body.get('block')
  startTime = body.get('startTime')
  l1Tol2 = body.get('l1Tol2')
  key = body.get('key')
  try:    endTime = body.get('endTime')
  except: endTime = None
  try:    cdmTxHash = body.get('cdmHash')
  except: cdmTxHash = None
  try:    cdmBlock = body.get('cdmBlock')
  except: cdmBlock = None

  # Read YML
  with open("env.yml", 'r') as ymlfile:
    config = yaml.load(ymlfile)

  # Get key
  securityKey = config.get('SEND_CDM_PRIVATE_KEY')

  if securityKey != key:
    return returnReponse(404)

  # Get MySQL host and port
  endpoint = config.get('RDS_ENDPOINT')
  user = config.get('RDS_MYSQL_NAME')
  dbpassword = config.get('RDS_MYSQL_PASSWORD')
  dbname = config.get('RDS_DBNAME_CDM')

  con = pymysql.connect(endpoint, user=user, db=dbname,
                        passwd=dbpassword, connect_timeout=5)
  statusCode = 201
  with con:
    try:
      cur = con.cursor()
      cur.execute("""INSERT INTO tx
        (hash, block, l1Tol2, startTime, endTime, cdmHash, cdmBlock) VALUES
        (%s,   %s,    %s,     %s,        %s,      %s,      %s)
        ON DUPLICATE KEY UPDATE
        endTime=%s, cdmHash=%s, cdmBlock=%s
      """, (txHash, block, l1Tol2, startTime, endTime, cdmTxHash, cdmBlock, endTime, cdmTxHash, cdmBlock))
    except Exception as e:
      print('error: ', e)
      statusCode = 400

  con.close()

  return returnReponse(statusCode)

def returnReponse(statusCode):
  if statusCode == 201:
    body = json.dumps({'status': 'succeeded'})
  else:
    body = json.dumps({'status': 'failed'})
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
    "body": body
  }
