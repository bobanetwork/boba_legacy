import json
import yaml
import pymysql

def watcher_getL2Airdrop(event, context):

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

  airdropPayload = {}

  if key != securityKey:
    return returnReponse(404, airdropPayload)

  statusCode = 201
  with con:
    try:
      cur = con.cursor()
      cur.execute("""SELECT airdrop.address, airdrop.amount, airdrop.claimed, airdrop.claimedTimestamp, airdrop.claimImmediate, airdrop.claimUnlockTime,
        merkleProofs.`index`, merkleProofs.amount, merkleProofs.proof
        FROM airdropL2 as airdrop
        LEFT JOIN merkleProofsL2 as merkleProofs
        ON airdrop.address = merkleProofs.address
        WHERE airdrop.address=%s
      """, (address))
      payload = cur.fetchall()
      if len(payload) == 1:
        [address, amount, claimed, claimedTimestamp, claimImmediate, claimUnlockTime, index, hexAmount, proof ] = payload[0]
        airdropPayload = {
          "address" : address, "amount": amount, "claimed": claimed,
          "claimedTimestamp": claimedTimestamp, "claimImmediate": claimImmediate, "claimUnlockTime": claimUnlockTime,
          "merkleProof": {
            "index": index, "amount": hexAmount, "proof": json.loads(proof)
          },
          "network": "bobanetwork"
        }
      else:
        airdropPayload = {
          "address" : address, "amount": 0, "claimed": False,
          "claimedTimestamp": None, "claimedAmount": None,
          "claimImmediate": None, "claimUnlockTime": None,
          "merkleProof": {
            "index": None, "amount": None, "proof": None
          },
          "network": "bobanetwork"
        }
    except Exception as e:
      statusCode = 500
      print("error: ", e)

  con.close()

  return returnReponse(statusCode, airdropPayload)

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
