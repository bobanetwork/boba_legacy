#!python
#
# Copyright 2021 mmontour@enya.ai. Internal use only; all rights reserved
#
# Health check utility

from web3 import Web3
from web3.logs import STRICT, IGNORE, DISCARD, WARN
import requests,json
import os,sys,time
from utils import Account,Addrs,Context,LoadEnv

assert(len(sys.argv)==3)

env = LoadEnv()
A = Addrs(env)
gCtx = Context(env,A)

acct = Account(Web3.toChecksumAddress(env['funder_acct'][0]),env['funder_acct'][1])

if sys.argv[2] == "start":
  tx = gCtx.contracts['L1_BobaPortal'].functions.HealthCheckStart().buildTransaction({
    'nonce':gCtx.rpc[1].eth.getTransactionCount(acct.address),
    'from':acct.address,
    'value':100000
  })
  
  stx = gCtx.rpc[1].eth.account.sign_transaction(tx, acct.key)
  ret = gCtx.rpc[1].eth.send_raw_transaction(stx.rawTransaction)
  rcpt = gCtx.rpc[1].eth.wait_for_transaction_receipt(ret)
  assert(rcpt.status == 1)
  print("Health check started at", time.time())
  
elif sys.argv[2] == "status":
  deadline = gCtx.contracts['L1_BobaPortal'].functions.healthCheckDeadline().call()
  if deadline == 115792089237316195423570985008687907853269984665640564039457584007913129639935: #uint256max
    print("healthCheckDeadline = Inactive")
  else:
    print("healthCheckDeadline = ", deadline, "relTime =", deadline - time.time())
  
  pass
elif sys.argv[2] == "claim":
  tx = gCtx.contracts['L1_BobaPortal'].functions.HealthCheckClaim().buildTransaction({
    'nonce':gCtx.rpc[1].eth.getTransactionCount(acct.address),
    'from':acct.address
  })
  
  stx = gCtx.rpc[1].eth.account.sign_transaction(tx, acct.key)
  ret = gCtx.rpc[1].eth.send_raw_transaction(stx.rawTransaction)
  rcpt = gCtx.rpc[1].eth.wait_for_transaction_receipt(ret)
  assert(rcpt.status == 1)
  print("Health check claimed at", time.time())
elif sys.argv[2] == "reset":
  tx = gCtx.contracts['L1_BobaPortal'].functions.HealthCheckReset().buildTransaction({
    'nonce':gCtx.rpc[1].eth.getTransactionCount(acct.address),
    'from':acct.address
  })
  
  stx = gCtx.rpc[1].eth.account.sign_transaction(tx, acct.key)
  ret = gCtx.rpc[1].eth.send_raw_transaction(stx.rawTransaction)
  rcpt = gCtx.rpc[1].eth.wait_for_transaction_receipt(ret)
  assert(rcpt.status == 1)
  print("Health check reset")
else:
  assert(False)

