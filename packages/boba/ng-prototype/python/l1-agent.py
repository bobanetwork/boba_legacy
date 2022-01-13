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
import rlp

from utils import Account,Addrs,Context,LoadEnv

import math
from hexbytes import HexBytes
#import py-trie

def myAssert(cond):
  assert(cond)
  
env = LoadEnv()

l1_agent = Account(Web3.toChecksumAddress(env['l1_agent_acct'][0]),env['l1_agent_acct'][1])

#############################
A = Addrs(env)
boba_addrs = A.boba_addrs
gCtx = Context(env, A)

fastQueue = queue.Queue()
slowQueue = queue.Queue()
slowGate = 0  # Highest block number which the SlowScanner may inspect (based on Fast submissions)


sccBatches = []
sccTxns = []
sccLast = []

# Containers to accumulate message batches prior to submission

class Batch:
  def __init__(self):
    self.headers = []
    self.bodies = []
    self.proofs = []
    self.batchSize = 0
    
    self.batchStartTime = time.time()
    self.msgStartTime = None

  def addMessage(self,ctx,hdr,body,proof):
   if self.msgStartTime is None:
     self.msgStartTime = time.time()
  
   self.headers.append(hdr)
   self.bodies.append(body)
   self.proofs.append(proof)
   
   #print("Added event, batch count =", len(self.headers))
   ctx.logPrint("Added event, batch count = {}".format(len(self.headers)))
class FastBatch(Batch):
  def __init__(self):
    Batch.__init__(self)
    self.prevBlock = None
    self.prevSR = None
    
  # Tests whether a batch is ready for submission according to any of the
  # following conditions
  def isReady(self,prevBlock,prevSR ):
    ret = False
    
    # If there's already a batch in the queue, we don't push another one based
    # on timers (only on sizes). 
    if (fastQueue.qsize() == 0) and ((time.time() - self.batchStartTime) > 30):
      # batch age > threshold (even if empty)  
      ret = True
    elif len(self.headers) == 0:
      ret = False
    elif len(self.headers) >= 20:
      #   number of msgs > threshold
      ret = True
    elif False:
      # FIXME: total data size > threshold
      ret = True
    elif (fastQueue.qsize() == 0) and ((time.time() - self.msgStartTime) > 10):
      # Oldest message is older than threshold
      ret = True
    
    # We defer setting prevBlock until we find the first new message
    # OR until we're just about to push an empty block while idle. 
    if (ret or len(self.headers) > 0) and self.prevBlock is None:
      self.prevBlock = prevBlock
      self.prevSR = prevSR
      
    #print("isReady:", ret, "len:", len(self.headers), "prevBlock", self.prevBlock, "batchAge:", time.time() - self.batchStartTime)
    return ret


    
class SlowBatch(Batch):
  def __init__(self):
    Batch.__init__(self)
    self.l2Num = None
    
  # Tests whether a batch is ready for submission according to any of the
  # following conditions
  def isReady(self):
    ret = False
        
    if len(self.headers) == 0:
      ret = False
    elif len(self.headers) >= 10:
      #   number of msgs > threshold
      ret = True
    elif False:
      # FIXME: total data size > threshold
      ret = True
    elif (time.time() - self.msgStartTime) > 60:
      # Oldest message is older than threshold
      ret = True
    #print("isReady(slow):", ret, "len:", len(self.messages))
    return ret

  def addMessage(self,ctx,hdr, body, l2Block, proof):
    super().addMessage(ctx,hdr,body,proof)
    if self.l2Num is None:
      self.l2Num = l2Block - 1 # FIXME?


# This thread scans the L1 chain to extract SCC batches which are needed to 
# generate proofs for the Optimism message tunnel.
def SccScanner(env,A):
  print ("Starting SCC Scanner thread")
  ctx = Context(env, A)

  sccFilter = ctx.contracts['StateCommitmentChain'].events.StateBatchAppended.createFilter(
    fromBlock=1,
    toBlock='latest'
  )
  
  sccIdx = 0
  
  getter = sccFilter.get_all_entries
  while True:
    for event in getter():
      # print("SCC",event)
      assert(event.args['_batchIndex']==len(sccBatches))
      sccBatches.append(event)
      sccIdx += event.args['_batchSize']
      sccLast.append(sccIdx)
      
      txn = ctx.rpc[1].eth.get_transaction(event.transactionHash)
      sccTxns.append(txn)
#      print("Batch", event.args['_batchIndex'], "size", event.args['_batchSize'],"lastL2BN", sccIdx)
      
#    print("SCC done")
    getter = sccFilter.get_new_entries
    time.sleep(5)

# Find the state root, then generate its proof for the specified L2 block number      
def srProof(ctx, l2bn):
  ctx.logPrint("Looking for SR from L2 block {}".format(l2bn))
  
  # FIXME - linear search for now, bisection eventually
  batchIdx = 0
  while l2bn > sccLast[batchIdx]:
    batchIdx += 1
    while batchIdx >= len(sccLast):
      ctx.logPrint("Waiting for SCC to catch up...")
      time.sleep(5)
      
  b = sccBatches[batchIdx].args 
    
  iib = b['_batchSize'] + l2bn - sccLast[batchIdx] - 1
  ctx.logPrint("Found at batchIdx {} batchLast {} iib {} batchRoot {}".format(batchIdx, sccLast[batchIdx], iib, Web3.toHex(b['_batchRoot'])))  #, sccTxns[batchIdx].input))
  
  treeSize = int(math.pow(2, math.ceil(math.log2(b['_batchSize']))))
  #print("Tree size", b['_batchSize'], "->", treeSize)
  
  roots = sccTxns[batchIdx].input[10+(64*3):] # Skip to the concatenated stateroots
  tree_elements = [[]]
  for i in range(treeSize):
    if i < b['_batchSize']:
      sr = Web3.toBytes(hexstr=roots[64*i:64*(i+1)])
    else:
      sr = Web3.sha3(hexstr="0x0000000000000000000000000000000000000000000000000000000000000000")
    #print("SR",i,"=",Web3.toHex(sr))
    tree_elements[0].append(HexBytes(sr))
  
  # Build tree
  #print("Generating tree")
  level = 0
  while len(tree_elements[level]) > 1:
    #print("Level",level)
    tree_elements.append([])
    #print("pre-tree",tree_elements)
    for i in range(0,len(tree_elements[level])-1,2):
      #print("i",i)
      tree_elements[level+1].append(Web3.sha3(tree_elements[level][i] + tree_elements[level][i+1]))
    level += 1

  #print("root",Web3.toHex(tree_elements[-1][0]))
  assert(tree_elements[-1][0] == b['_batchRoot'])
  
  # Generate tree proof for Optimism
  treeProof = []
  level = 0
  idx = iib
  
  while len(tree_elements[level]) > 1:
    if (idx % 2) == 1:
      treeProof.append(tree_elements[level][idx-1])
    else:
      treeProof.append(tree_elements[level][idx+1])
    idx =idx//2
    level += 1
  #print("treeProof:",treeProof)
  
  stateRootProof = {
    'index':iib,
    'siblings':treeProof
  }
  bh = sccBatches[batchIdx].args
  
  proof = {
    'stateRoot':tree_elements[0][iib],
    'stateRootBatchHeader': {
      'batchIndex':bh['_batchIndex'],
      'batchRoot':bh['_batchRoot'],
      'batchSize':bh['_batchSize'],
      'prevTotalElements':bh['_prevTotalElements'],
      'extraData':HexBytes(bh['_extraData'])
    },
    'stateRootProof':stateRootProof
  }
  #print("srProof",proof)
  return proof
  
def ChainScanner(env,A):
  ctx = Context(env, A, "./logs/L1-ChainScanner.log", "CS")
  ctx.logPrint ("Starting ChainScanner thread")

  at_block = ctx.contracts['L1_BobaPortal'].functions.scanFromL2().call()

  last_seq = ctx.contracts['L1_BobaPortal'].functions.lastSeqIn().call()
  last_slow_seq = ctx.contracts['L1_BobaPortal'].functions.lastSlowIn().call()
  ctx.logPrint("L2 starting block {} {}".format(at_block, ctx.contracts['L1_BobaPortal'].address))
  
  prev_block = at_block
  
  prevSR =  ctx.rpc[2].eth.get_block(prev_block).stateRoot
  currentSR =  ctx.rpc[2].eth.get_block(at_block).stateRoot

  ctx.logPrint("Starting with prev_block {} at_block {} NX sequence: {} NX Slow: {}".format(prev_block, at_block, last_seq +1, last_slow_seq+1))

  currentBatch = FastBatch()
  
  while True:      
    if at_block > ctx.rpc[2].eth.blockNumber:
      time.sleep(2)
      
      if currentBatch.isReady(prev_block, prevSR):
        ctx.logPrint("Putting batch into submission queue(1), prev_block {}".format(prev_block))
        fastQueue.put(currentBatch)
        currentBatch = FastBatch()
      continue
  
    #print("[L2 Block",at_block,"]")
    
    b = ctx.rpc[2].eth.getBlock(at_block)
    currentSR = b.stateRoot
    
    tx = b.transactions[0]
    r = ctx.rpc[2].eth.get_transaction_receipt(tx)

    for event in ctx.contracts['L2_BobaPortal'].events.BobaMsgOut().processReceipt(r,errors=DISCARD):
      ctx.logPrint("L2_EV {} {}".format(event.blockNumber,Web3.toHex(event.transactionHash)))
      #tx = ctx.rpc[1].eth.get_transaction(event.transactionHash)
      if event.address != ctx.contracts['L2_BobaPortal'].address:
        continue
 
      A = event.args
      Sequence = Web3.toInt(A.header[0:8])
      MsgType = Web3.toInt(A.header[8:12])
      MsgValue = Web3.toInt(A.header[12:64])

      if Sequence <= last_slow_seq:
        ctx.logPrint("L2_EV Already processed, skipping Slow sequence {}".format(Sequence))
        continue
        
      if Sequence <= last_seq:
        ctx.logPrint("X Hdr {} Type {} MSG_HASH {} PL {}".format(Sequence, Web3.toHex(MsgType), Web3.toHex(A.msg_hash), Web3.toHex(A.payload)))
        continue
      
      ctx.logPrint("  Hdr {} Type {} MSG_HASH {} PL {}".format(Sequence, Web3.toHex(MsgType), Web3.toHex(A.msg_hash), Web3.toHex(A.payload)))
      assert(Sequence == last_seq + 1)
      
      
      #print("PACK", Web3.toHex(msg_body), Web3.toHex(A.payload))
        
      
      # On first startup, defer creating the batch container until we've caught up to the first non-skipped msg.
      # The scanner has to start behind the oldest Slow message, so will skip over a lot of Fast messages before
      # finding a sequence number which hasn't already been processed.
      if currentBatch is None:
        currentBatch = FastBatch(prev_block, prevSR)
        
      if (MsgType == 0x80000003):  # Fast Optimism msg
        proof2 = optProof(ctx, A.payload, event.blockNumber, False)
     
        currentBatch.addMessage(ctx,A.header, A.payload,proof2) # FIXME Fast-optimism proof
        

      elif (MsgType & 0x80000000):  # Fast msg
        currentBatch.addMessage(ctx,A.header, A.payload,"") # FIXME Fast-optimism proof
      else:
        currentBatch.addMessage(ctx,A.header, Web3.toBytes(A.msg_hash),"")
      last_seq += 1
      
      if currentBatch.isReady(prev_block, prevSR):
        ctx.logPrint("Putting batch into submission queue(2), prev_block {}".format(prev_block))
        fastQueue.put(currentBatch)
        currentBatch = FastBatch()

    prev_block = at_block
    prevSR = currentSR
    at_block += 1

  ctx.logPrint ("ChainScanner thread done")

# Generate the optimism proof for a message
def optProof(ctx, message, l2bn, fraudWait):
  ctx.logPrint("Generating proof for Optimism message")
  
  # FIXME - put the selector back into the tunnel payload
  b1 = message + Web3.toBytes(hexstr='0x4200000000000000000000000000000000000007')
  #print("B1", Web3.toHex(b1))
  
  h1 = Web3.sha3(b1)
  z1 = Web3.toBytes(hexstr='0x0000000000000000000000000000000000000000000000000000000000000000')
  messageSlot = Web3.sha3(h1 + z1)
  #print("H1", Web3.toHex(h1), "messageSlot", Web3.toHex(messageSlot))
  
  eth_proof = ctx.rpc[2].eth.get_proof("0x4200000000000000000000000000000000000000", [messageSlot], l2bn)
  #print("stateTrieWitness", Web3.toHex(rlp.encode(eth_proof.accountProof)))
  #print("storageTrieWitness", Web3.toHex(rlp.encode(eth_proof.storageProof[0].proof)))
  
  proof = srProof(ctx,l2bn)
  proof['stateTrieWitness'] = HexBytes(rlp.encode(eth_proof.accountProof))
  proof['storageTrieWitness'] = HexBytes(rlp.encode(eth_proof.storageProof[0].proof))

  #print("PROOF", proof)
  
  if fraudWait:
    batchIdx = proof['stateRootBatchHeader']['batchIndex']
    b = sccBatches[batchIdx].args

    bb = {
        'batchIndex':b['_batchIndex'],
        'batchRoot':b['_batchRoot'],
        'batchSize':b['_batchSize'],
        'prevTotalElements':b['_prevTotalElements'],
        'extraData':HexBytes(b['_extraData'])
    }

    ifw = ctx.contracts['StateCommitmentChain'].functions.insideFraudProofWindow(bb).call()
    while ifw:
      ctx.logPrint("Waiting for batch {} to clear Fraud Proof window".format(bb['batchIndex']))
      time.sleep(20)
      ifw = ctx.contracts['StateCommitmentChain'].functions.insideFraudProofWindow(bb).call()
    ctx.logPrint("Proceeding with batch {}".format(bb['batchIndex']))
  
  
  (proof2,readback) = ctx.contracts['L1_BobaPortal'].functions.PackProof(proof).call()
  #print("PROOF2", Web3.toHex(proof2))
  #print("READBACK", readback)

  return proof2
# SlowScanner goes through the chain and assembles batches of Slow messages which are
# older than the fraud window. These are then handed off to the Submitter. There is some
# duplicated effort because this thread is re-processing messages which were already
# handled on the Fast path (to register the message hash etc) but this is better than
# having to store the parsed message data off-chain for 7 days.
  
def SlowScanner(env,A):
  global slowGate
  
  # FIXME - should checkpoint the highest confirmed sequence number on Fast path, then 
  # pause SlowScanner before we overrun it. Not an issue for production but could be a
  # problem on Dev systems with short delays
  
  ctx = Context(env, A, "./logs/L1-SlowScanner.log", "SS")
  ctx.logPrint("Starting Slow Scanner")
  
  at_block = ctx.contracts['L1_BobaPortal'].functions.scanFromL2().call()

  last_seq = ctx.contracts['L1_BobaPortal'].functions.lastSeqIn().call()
  last_slow_seq = ctx.contracts['L1_BobaPortal'].functions.lastSlowIn().call()
  ctx.logPrint("L2 starting block {} {}".format(at_block, ctx.contracts['L1_BobaPortal'].address))
  
  prev_block = at_block
  
  #prevSR =  ctx.rpc[2].eth.get_block(prev_block).stateRoot
  #currentSR =  ctx.rpc[2].eth.get_block(at_block).stateRoot

  ctx.logPrint("Starting with prev_block {} at_block {} NX sequence: {} NX Slow: {}".format(prev_block, at_block, last_seq +1, last_slow_seq+1))
  
  currentBatch = SlowBatch()
  waitMsg = 0
  
  while True:      
    if at_block > slowGate:
      if slowGate != waitMsg:
        ctx.logPrint("SlowScanner waiting at {}, batchSize {}".format(slowGate, len(currentBatch.headers)))
        waitMsg = slowGate
      time.sleep(5)
  
      if currentBatch.isReady():
        ctx.logPrint("Putting Slow batch into submission queue(2)")
        slowQueue.put(currentBatch)
        currentBatch = SlowBatch()
      continue
      
    b = ctx.rpc[2].eth.getBlock(at_block)
    currentSR = b.stateRoot
    
    tx = b.transactions[0]
    r = ctx.rpc[2].eth.get_transaction_receipt(tx)

    for event in ctx.contracts['L2_BobaPortal'].events.BobaMsgOut().processReceipt(r,errors=DISCARD):
      ctx.logPrint("L2_EV {} {}".format(event.blockNumber,Web3.toHex(event.transactionHash)))
      #tx = ctx.rpc[1].eth.get_transaction(event.transactionHash)
      if event.address != ctx.contracts['L2_BobaPortal'].address:
        continue
 
      A = event.args
      Sequence = Web3.toInt(A.header[0:8])
      MsgType = Web3.toInt(A.header[8:12])
      MsgValue = Web3.toInt(A.header[12:64])
       
      if (MsgType & 0x80000000 != 0):
        continue
         
      if Sequence <= last_slow_seq:
        ctx.logPrint("X Hdr {} Type {} MSG_HASH {} PL {}".format(Sequence, Web3.toHex(MsgType), Web3.toHex(A.msg_hash), Web3.toHex(A.payload)))
        continue
      
      ctx.logPrint("  Hdr {} Type {} MSG_HASH {} PL {}".format(Sequence, Web3.toHex(MsgType), Web3.toHex(A.msg_hash), Web3.toHex(A.payload)))
      
      ctx.logPrint("SlowSeqs {} {} {}".format(Sequence, last_seq, last_slow_seq))
      last_slow_seq = Sequence # FIXME
      # FIXME assert(Sequence == last_slow_seq + 1)
      

      ctx.logPrint("SlowScanner inspecting event")
    
      proof2 = ""
      
      valid_at = ctx.contracts['L1_BobaPortal'].functions.slowValidTime(A.msg_hash).call()
      Tdiff = valid_at - time.time()
      if Tdiff > 0:
        ctx.logPrint("Waiting {} seconds until msg {} is valid".format(Tdiff, Sequence))
        time.sleep(Tdiff)
        ctx.logPrint("Continuing with msg {}".format(Sequence))
           
      if MsgType == 0x03: # FIXME - Optimism flag
        proof2 = optProof(ctx, A.payload, event.blockNumber, True)

      currentBatch.addMessage(ctx,A.header, A.payload, event.blockNumber, proof2)
      
      if currentBatch.isReady():
        ctx.logPrint("Putting Slow batch into submission queue(2)")
        slowQueue.put(currentBatch)
        currentBatch = SlowBatch()
    prev_block = at_block
    at_block += 1
    
  ctx.logPrint("Slow Scanner thread done")

# Submitter thread is responsible for taking finished batches out of the queues and submitting them to 
# the contracts. Failed submissions are retried. In future, this thread should have the ability to modify
# a pending submission with an increasing gas price if it is not confirmed within a reasonable interval
# (replacing the flawed "ynatm" approach which is used in the existing services). 
# For now the Slow batches are only processed when the Fast queue is idle, but there should be some limit
# to ensure that Slow operations can't stall forever. 

# DoSub handles the actual submission, watching for a receipt to appear and increasing the gas price
# if it's taking too long. "t" is the buildTransaction() output for the batch in question (fast or slow)
def DoSub(env, A, ctx, t):
  orig_gas = t['gas']
  t['gas'] = int(orig_gas + 50000) # FIXME
  #print(" T ", t)

  lastBN = ctx.rpc[1].eth.blockNumber
  ctx.logPrint("Sub at blockNumber {}".format(lastBN))
  
  r = ctx.rpc[1].eth.account.sign_transaction(t, l1_agent.key)
  r = ctx.rpc[1].eth.send_raw_transaction(r.rawTransaction)

  # rcpt = ctx.rpc[1].eth.wait_for_transaction_receipt(r, poll_latency=1)
  rcpt = None
  cnt = 0
  failCount = 0
  status = 0
  
  while status == 0 and failCount < 5:
    while True:
      if ctx.rpc[1].eth.blockNumber <= lastBN:
        ctx.logPrint("  ...")
        time.sleep(2)
        #continue
      lastBN += 1
      ctx.logPrint("  checkBN {}".format(lastBN))
      try:
        rcpt = ctx.rpc[1].eth.get_transaction_receipt(r)
        if rcpt.status != 1:
          ctx.logPrint("  rcpt",rcpt)
        break
      except:
        cnt += 1
        ctx.logPrint("  no rcpt yet, cnt={}".format(cnt))

        # Insert logic to replace the txn with an increasing gas price.
        # If we hit a cap, log a warning/error and keep waiting. 
        # FIXME - do we need to check for a txn which is dropped entirely?
      time.sleep(2)

    ctx.logPrint("Batch status {} in block {} gas {}/{} txhash {}".format(rcpt.status, rcpt.blockNumber, rcpt.gasUsed, orig_gas, Web3.toHex(r)))
    status = rcpt.status
    
    if status != 1:
      failCount += 1
      ctx.logPrint("ERROR - Batch submission failed, failCount={} receipt={}".format(failCount,rcpt))
      
  assert(status == 1)
  
def Submitter(env,A):
  global slowGate
  ctx = Context(env, A, "./logs/L1-Submitter.log", "SU")
  ctx.logPrint("Starting Submitter thread")
  
  # FIXME - on a service restart, there might be pending transactions in the mempool. Should find a way to
  # scan and cancel them, or at least wait <n> blocks to hopefully have them clear on their own.  
  
  last_seq = ctx.contracts['L1_BobaPortal'].functions.lastSeqIn().call()
  tip_block = ctx.contracts['L1_BobaPortal'].functions.highestL2Block().call()
  ctx.logPrint("L2 starting tip block {} last_seq {}".format(tip_block, last_seq))
  sleepMsgFlag = True
  
  while True:
    loop_counter = 0
    while fastQueue.qsize() > 0 and loop_counter < 10:
      batch = fastQueue.get()

      ctx.logPrint("Got batch len {} prv_block {} tip_block {} SR {}".format(len(batch.headers), batch.prevBlock, tip_block, Web3.toHex(batch.prevSR)))

      slowGate = batch.prevBlock # FIXME
      if (batch.prevBlock <= tip_block and len(batch.headers) == 0):
        ctx.logPrint("Discarding empty batch (L2 block has not advanced)")
        continue
        
      assert(batch.prevBlock >= tip_block)
      #print("PRE1", len(batch.messages), "PB", batch.prevBlock, "SR", Web3.toHex(batch.prevSR), repr(batch.messages))
      #print("PRE2", Web3.toHex(batch.headers[0]), Web3.toHex(batch.bodies[0]))

      t = ctx.contracts['L1_BobaPortal'].functions.FastBatchIn(
        batch.prevBlock,
        batch.prevSR,
        batch.headers,
        batch.bodies,
        batch.proofs
       ).buildTransaction({
        'from':l1_agent.address,
        'nonce':ctx.rpc[1].eth.get_transaction_count(l1_agent.address)
      })

      #print("FASTBATCH {}".format(t))
      ctx.logPrint("Sub FAST batch...")
      DoSub(env, A, ctx, t)
      
      tip_block = batch.prevBlock
      sleepMsgFlag = True

      loop_counter += 1

    if slowQueue.qsize() > 0:
      batch = slowQueue.get()
      ctx.logPrint("Submitter: submitting Slow batch")
      #print("PRE", Web3.toHex(batch.headers[0]), Web3.toHex(batch.bodies[0]))
      #print("PRE_SLOWBATCH", batch.l2Num, Web3.toHex(batch.headers[0]), Web3.toHex(batch.bodies[0]), Web3.toHex(batch.proofs[0]))
      
      t = ctx.contracts['L1_BobaPortal'].functions.SlowBatchIn(
        batch.l2Num,
        batch.headers,
        batch.bodies,
        batch.proofs
      ).buildTransaction({
        'from':l1_agent.address,
        'nonce':ctx.rpc[1].eth.get_transaction_count(l1_agent.address)
      })

      #print("BUILD",t)
      ctx.logPrint("Sub SLOW batch...")
      DoSub(env,A, ctx, t)
      
      sleepMsgFlag = True
    else:
      if sleepMsgFlag:
        ctx.logPrint("Submitter: sleeping")
        sleepMsgFlag = False
      time.sleep(5)
      
  ctx.logPrint("Submitter thread done")

print("Starting agent threads")

sccThread = threading.Thread(target=SccScanner, args=(env,A,))
sccThread.start()

#time.sleep(86400)
scanner = threading.Thread(target=ChainScanner, args=(env,A,))
scanner.start()
submitter = threading.Thread(target=Submitter, args=(env,A,))
submitter.start()
slowScanner = threading.Thread(target=SlowScanner, args=(env,A,))
slowScanner.start()
