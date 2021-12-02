import json
import yaml
import pymysql
import time

def watcher_initiateL1Airdrop(event, context):

  # Parse incoming event
  body = json.loads(event["body"])
  address = body.get("address")
  key = body.get("key")

  # Read YML
  with open("env.yml", 'r') as ymlfile:
    config = yaml.load(ymlfile)

  # Get MySQL host and port
  endpoint = config.get('RDS_ENDPOINT')
  user = config.get('RDS_MYSQL_NAME')
  dbpassword = config.get('RDS_MYSQL_PASSWORD')
  dbname = config.get('RDS_DBNAME_AIRDROP')
  # key
  securityKey = config.get('SEND_AIRDROP_PRIVATE_KEY')

  con = pymysql.connect(endpoint, user=user, db=dbname,
                        passwd=dbpassword, connect_timeout=5)

  if key != securityKey:
    return returnReponse(400)

  statusCode = 201
  with con:
    try:
      unixTime = int(time.time()) + 30 * 24 * 60 * 60
      cur = con.cursor()
      cur.execute("""UPDATE airdropL1
        SET claimUnlockTime=%s WHERE address=%s AND claimUnlockTime is NULL AND claimed=%s
      """, (unixTime, address, False))
    except Exception as e:
      statusCode = 500
      print("error: ", e)
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
