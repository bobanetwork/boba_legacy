#!python
#
# Copyright 2021 mmontour@enya.ai. Internal use only; all rights reserved
#
# L2-agent proof of concept. Watches for events on L1 and calls L2 portal 
# to act on them, minting oETH as appropriate. 

import os,sys
import threading
import signal
import time
from random import *
import queue
import requests,json
from web3 import Web3
from web3.gas_strategies.time_based import fast_gas_price_strategy
from web3.middleware import geth_poa_middleware
from web3.logs import STRICT, IGNORE, DISCARD, WARN

from utils import Account,Addrs,Context,LoadEnv


env = LoadEnv()
A = Addrs(env)
boba_addrs = A.boba_addrs

l2_agent = Account(Web3.toChecksumAddress(env['l2_agent_acct'][0]),env['l2_agent_acct'][1])

# Agent: Reads the other chain's events and Acts on its own chain. So L2_Agent handles the L1->L2 traffic
def L2_Agent(env,A):
  ctx = Context(env, A)
  
  #at_block = ctx.rpc[1].eth.blockNumber - 1
  #last_seq = ctx.contracts['L2_BobaPortal'].functions.stats().call()[0]
  
  start_block = ctx.contracts['L2_BobaPortal'].functions.lastL1Block().call()
  last_seq = ctx.contracts['L2_BobaPortal'].functions.lastSeqIn().call()
  
  at_block = start_block
  
  print("L1 starting block", at_block)
  print("Next expected sequence:", last_seq + 1)
  
  FF = ctx.contracts['L1_BobaPortal'].events.BobaMsgDown.createFilter(fromBlock=start_block,toBlock='latest')

  L2 = ctx.contracts['L2_BobaPortal']
  getter = FF.get_all_entries
  while True:
  
    while at_block >= ctx.rpc[1].eth.blockNumber:
      time.sleep(2)
  
    print("[L1 Block",at_block,"]")
    for event in getter():
      print("EventMatch in L1 block",event.blockNumber, "txhash", Web3.toHex(event.transactionHash))
      #tx = ctx.rpc[1].eth.get_transaction(event.transactionHash)
      b = ctx.rpc[1].eth.getBlock(event.blockNumber)
      A = event.args
      #print("E",event)
      
      #print("->",Web3.toHex(A.header))
      Sequence = Web3.toInt(A.header[0:8])
      MsgType = Web3.toInt(A.header[8:12])
      MsgValue = Web3.toInt(A.header[12:64])
       
      if Sequence <= last_seq:
        # Skip. already processed.
        print("X Hdr", Sequence, MsgType, MsgValue, "MSG_HASH", Web3.toHex(A.msg_hash), "PL", Web3.toHex(A.payload))
        continue
      print("  Hdr", Sequence, MsgType, MsgValue, "MSG_HASH", Web3.toHex(A.msg_hash), "PL", Web3.toHex(A.payload))
      
      assert(Sequence == last_seq + 1)
              
      t = L2.functions.L1MessageIn(event.blockNumber, b.timestamp, A.header, A.payload).buildTransaction({
        'nonce':ctx.rpc[2].eth.get_transaction_count(l2_agent.address)
      })
      r = ctx.rpc[2].eth.account.sign_transaction(t, l2_agent.key)

      r = ctx.rpc[2].eth.send_raw_transaction(r.rawTransaction)

      rcpt = ctx.rpc[2].eth.wait_for_transaction_receipt(r, poll_latency=1)
      print("Relay status", rcpt.status, "block", rcpt.blockNumber)
      if rcpt.status != 1:
        print("RCPT:",rcpt)
      if rcpt.status == 1:
        last_seq = Sequence
      assert(rcpt.status == 1)  

    getter = FF.get_new_entries
    at_block += 1

print("Starting L2 agent")
L2_Agent(env,A)

