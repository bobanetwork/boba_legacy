#!python
#
# Copyright 2021 mmontour@enya.ai. Internal use only; all rights reserved
#
# Basic fraud checker. Reads state roots from SCC and checks them against
# actual L2 values, reporting mismatches. Note - code was copied from
# stress_tester.py and contains a lot of irrelevant cruft to be cleaned up
# later.

import os,sys
from web3 import Web3
import signal
import time
import requests,json
import logging
from web3.middleware import geth_poa_middleware
from web3.logs import STRICT, IGNORE, DISCARD, WARN
import threading
from jsonrpclib.SimpleJSONRPCServer import SimpleJSONRPCServer

logging.basicConfig(format='%(levelname)s %(asctime)s %(message)s', datefmt='%Y%m%dT%H%M%S')
logger = logging.getLogger('fraud-detector')
logger.setLevel(logging.DEBUG)
#logger.addHandler(logging.StreamHandler())

logger.debug (os.environ['L1_NODE_WEB3_URL'])
logger.debug (os.environ['L1_CONFIRMATIONS'])
logger.debug (os.environ['L2_NODE_WEB3_URL'])
logger.debug (os.environ['VERIFIER_WEB3_URL'])
logger.debug (os.environ['ADDRESS_MANAGER_ADDRESS'])
logger.debug (os.environ['L1_DEPLOYMENT_BLOCK'])
logger.debug (os.environ['L2_START_BLOCK'])
logger.debug (os.environ['L2_CHECK_INTERVAL'])

l1_confirmations = int(os.environ['L1_CONFIRMATIONS'])
# These can be changed from the defaults to start at a previously verified
# position in the chain, avoiding the need to replay many old blocks.
# Element_start must be set to the L2 block number corresponding to the
# first stateroot in the L1 block.
l1_base = int(os.environ['L1_DEPLOYMENT_BLOCK'])
element_start = int(os.environ['L2_START_BLOCK'])

# To reduce load on the mainnet L2 when many users are running fraud detectors, the L2
# state root is only queried once per <interval> seconds. The primary concern with respect
# to fraud is whether or not the transactions in the CTC lead to the state roots recorded
# in the SCC, and this can be determined using the L1 RPC only.
l2_check_interval = int(os.environ['L2_CHECK_INTERVAL'])
last_l2check = 0

Matched = {
  'Block':0, # Highest good block, and its corresponding state root
  'Root':"0x",
  'Time':time.time(), # Local timestamp
  'is_ok':True # Set false once a mismatch is found. This disables checkpointing
}

def status(*args):
  global Matched
  status = {
    'matchedBlock':Matched['Block'],
    'matchedRoot':Matched['Root'],
    'timestamp':Matched['Time'],
    'isOK':Matched['is_ok']
  }

  return status

try:
  with open("./db/checkpoint.dat", "r") as f:
    start_at = json.loads(f.read())
    element_start = start_at[0]
    l1_base = start_at[1]
    logger.info("Starting at checkpoint index " + str(element_start) + ", l1_block " + str(l1_base))
except:
  pass

batch_size =1000

rpc = [None]*4

rpc[1] = Web3(Web3.HTTPProvider(os.environ['L1_NODE_WEB3_URL']))
if 'rinkeby' in os.environ['L1_NODE_WEB3_URL']:
  rpc[1].middleware_onion.inject(geth_poa_middleware, layer=0)
assert (rpc[1].isConnected())
logger.debug ("Connected to L1_NODE_WEB3_URL")

while True:
  try:
    rpc[1] = Web3(Web3.HTTPProvider(os.environ['L1_NODE_WEB3_URL']))
    assert (rpc[1].isConnected())
    break
  except:
    logger.info ("Waiting for L1...")
    time.sleep(10)

rpc[1].middleware_onion.inject(geth_poa_middleware, layer=0)
logger.debug("Connected to L1_NODE_WEB3_URL")

while True:
  try:
    rpc[2] = Web3(Web3.HTTPProvider(os.environ['L2_NODE_WEB3_URL']))
    assert (rpc[2].isConnected())
    break
  except:
    logger.info ("Waiting for L2...")
    time.sleep(10)

rpc[2].middleware_onion.inject(geth_poa_middleware, layer=0)
logger.debug("Connected to L2_NODE_WEB3_URL")

while True:
  try:
    rpc[3] = Web3(Web3.HTTPProvider(os.environ['VERIFIER_WEB3_URL']))
    assert (rpc[3].isConnected())
    break
  except:
    logger.info ("Waiting for verifier...")
    time.sleep(10)

rpc[3].middleware_onion.inject(geth_poa_middleware, layer=0)
logger.debug("Connected to VERIFIER_WEB3_URL")

def loadContract(rpc, addr, abiPath):
  with open(abiPath) as f:
    abi = json.loads(f.read())['abi']
  c = rpc.eth.contract(address=addr, abi=abi)
  return c

address_manager = loadContract(rpc[1],os.environ['ADDRESS_MANAGER_ADDRESS'],'./contracts/Lib_AddressManager.json')
scc_addr = address_manager.functions.getAddress("StateCommitmentChain").call()
scc_contract = loadContract(rpc[1],scc_addr,'./contracts/StateCommitmentChain.json')

rCount = element_start - 1
checkpoint = [ element_start, l1_base ]
last_saved = l1_base
l3_block = 0

def doEvent(event, force_L2):
  global rCount
  global Matched
  global l3_block
  global l2_check_interval,last_l2check

  t = rpc[1].eth.get_transaction(event.transactionHash)

  (junk, ib) = scc_contract.decode_function_input(t.input)
  for sr in ib['_batch']:
    rCount += 1

    l2SR = None
    now = time.time()
    if (force_L2 and sr == ib['_batch'][-1]) or (now > last_l2check + l2_check_interval):
      l2SR = rpc[2].eth.getBlock(rCount)['stateRoot']
      last_l2check = now

    # Handle a possible lag in keeping the verifier up to date.
    waitCount = 0
    while rCount > l3_block:
      l3_block = rpc[3].eth.block_number
      if rCount <= l3_block:
        break
      logger.debug("Waiting for verifier to catch up, currently at block {}/{}".format(rpc[3].eth.block_number, rCount))
      time.sleep(15)
      waitCount += 1
      if waitCount % 40 == 0:
        logger.warning("Still waiting for verifier to catch up after {} attempts".format(waitCount))

    vfb = rpc[3].eth.getBlock(rCount)
    vfSR = vfb['stateRoot']

    match = ""
    if l2SR is not None and sr != l2SR:
      match = "**** SCC/L2 MISMATCH ****"
    if l2SR is not None and l2SR != vfSR:
      match = "**** L2/VERIFIER MISMATCH ****"
    if sr != vfSR:
      match = "**** SCC/VERIFIER MISMATCH ****"

    if l2SR:
      l2SR_str = Web3.toHex(l2SR)
    else:
      l2SR_str = "                                --                                "
    log_str = "{} {} {} {} {} {}".format(rCount, event.blockNumber, Web3.toHex(sr), l2SR_str, Web3.toHex(vfSR), match)
    if match != "":
      Matched['is_ok'] = False
      logger.warning(log_str)
    else:
      Matched['Block'] = rCount
      Matched['Root'] = Web3.toHex(sr)
      Matched['Time'] = time.time()
      logger.info(log_str)

    if event.blockNumber > checkpoint[1]:
      checkpoint[0] = rCount
      checkpoint[1] = event.blockNumber

def do_checkpoint():
  global last_saved
  global Matched
  if Matched['is_ok'] and last_saved != checkpoint[1]:
    with open("./db/checkpoint.dat", "w") as f:
      f.write(json.dumps(checkpoint))
    last_saved = checkpoint[1]

def server_loop(ws):
  ws.serve_forever()

def fpLoop():
  l1_tip = rpc[1].eth.block_number - l1_confirmations

  assert(l1_tip > l1_base)
  startBlock = l1_base
  logger.debug("SCC contract at {}, l1_base {}, l1_tip {}".format(scc_addr, l1_base, l1_tip))

  logger.info("#SCC-IDX L1-Block SCC-STATEROOT L2-STATEROOT VERIFIER-STATEROOT MISMATCH")

  topic_sig = Web3.toHex(Web3.keccak(text="StateBatchAppended(uint256,bytes32,uint256,uint256,bytes)"))

  while startBlock < l1_tip:
    toBlock = min(startBlock+batch_size, l1_tip) - 1
    #print("Scanning from",startBlock,"to",toBlock)

    batch = rpc[1].eth.getLogs({
      "fromBlock":startBlock,
      "toBlock":toBlock,
      "address":scc_addr,
      "topics":[topic_sig]
    })

    for event in batch:
      doEvent(event, False)

    startBlock = toBlock + 1
    do_checkpoint()

  logger.debug("Caught up to L1 tip. Waiting for new events from startBlock " + str(startBlock))

  while True:
    toBlock = rpc[1].eth.block_number - l1_confirmations
    if startBlock > toBlock:
      time.sleep(30)
      continue

    batch = rpc[1].eth.getLogs({
      "fromBlock":startBlock,
      "toBlock":toBlock,
      "address":scc_addr,
      "topics":[topic_sig]
    })

    for event in batch:
      doEvent(event, True)

    startBlock = toBlock + 1
    do_checkpoint()

  logger.info("Exiting")

ws = SimpleJSONRPCServer(('', 8555))
ws.register_function(status)
server_thread = threading.Thread(target=server_loop,args=(ws,))
server_thread.start()

fpLoop()
