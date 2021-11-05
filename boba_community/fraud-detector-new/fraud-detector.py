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

logging.basicConfig(format='%(levelname)s %(asctime)s %(message)s', datefmt='%Y%m%dT%H%M%S')
logger = logging.getLogger('fraud-detector')
logger.setLevel(logging.DEBUG)
#logger.addHandler(logging.StreamHandler())

logger.debug (os.environ['L1_NODE_WEB3_URL'])
logger.debug (os.environ['L2_NODE_WEB3_URL'])
logger.debug (os.environ['VERIFIER_WEB3_URL'])
logger.debug (os.environ['ADDRESS_MANAGER_ADDRESS'])
logger.debug (os.environ['L1_MAINNET_DEPLOYMENT_BLOCK'])

l1_base = int(os.environ['L1_MAINNET_DEPLOYMENT_BLOCK'])
element_start = 1

is_ok = True # Set false once a mismatch is found. This disables checkpointing

try:
  with open("./checkpoint.dat", "r") as f:
    start_at = json.loads(f.read())
    element_start = start_at[0]
    l1_base = start_at[1]
    logger.info("Starting at checkpoint index " + str(element_start) + ", l1_block " + str(l1_base))
except:
  pass

batch_size =1000

rpc = [None]*4
rpc[1] = Web3(Web3.HTTPProvider(os.environ['L1_NODE_WEB3_URL']))
assert (rpc[1].isConnected())
logger.debug ("Connected to L1_NODE_WEB3_URL")

rpc[2] = Web3(Web3.HTTPProvider(os.environ['L2_NODE_WEB3_URL']))
assert (rpc[2].isConnected())
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

def doEvent(event):
  global rCount
  global is_ok

  t = rpc[1].eth.get_transaction(event.transactionHash)

  (junk, ib) = scc_contract.decode_function_input(t.input)
  for sr in ib['_batch']:
    rCount += 1

    l2b = rpc[2].eth.getBlock(rCount)
    l2SR = l2b['stateRoot']

    # Handle a possible lag in keeping the verifier up to date.
    waitCount = 0
    while rCount > rpc[3].eth.block_number:
      logger.debug("Waiting for verifier to catch up, currently at block {}/{}".format(rpc[3].eth.block_number, rCount))
      time.sleep(15)
      waitCount += 1
      if waitCount % 40 == 0:
        logger.warning("Still waiting for verifier to catch up after {} attempts".format(waitCount))

    vfb = rpc[3].eth.getBlock(rCount)
    vfSR = vfb['stateRoot']

    match = ""
    if sr != l2SR:
      match = "**** SCC/L2 MISMATCH ****"
    elif l2SR != vfSR:
      match = "**** L2/VERIFIER MISMATCH ****"
    log_str = "{} {} {} {} {} {}".format(rCount, event.blockNumber, Web3.toHex(sr), Web3.toHex(l2SR), Web3.toHex(vfSR), match)
    if match != "":
      is_ok = False
      logger.warning(log_str)
    else:
      logger.info(log_str)

    if event.blockNumber > checkpoint[1]:
      checkpoint[0] = rCount
      checkpoint[1] = event.blockNumber

def do_checkpoint():
  global last_saved
  global is_ok
  if is_ok and last_saved != checkpoint[1]:
    with open("./checkpoint.dat", "w") as f:
      f.write(json.dumps(checkpoint))
    last_saved = checkpoint[1]

def fpLoop():  
  l1_tip = rpc[1].eth.block_number
  assert(l1_tip > l1_base)
  startBlock = l1_base
  logger.debug("SCC contract at {}, l1_base {}, l1_tip {}".format(scc_addr, l1_base, l1_tip))

  logger.info("#SCC-IDX L1-Block SCC-STATEROOT L2-STATEROOT VERIFIER-STATEROOT MISMATCH")

  topic_sig = Web3.toHex(Web3.keccak(text="StateBatchAppended(uint256,bytes32,uint256,uint256,bytes)"))

  while startBlock < l1_tip:
    toBlock = min(startBlock+batch_size, l1_tip) - 1
    #print("Scanning from",startBlock,"to",toBlock)

    FF = rpc[1].eth.filter({
      "fromBlock":startBlock,
      "toBlock":toBlock,
      "address":scc_addr,
      "topics":[topic_sig]
    })

    for event in FF.get_all_entries():
      doEvent(event)

    rpc[1].eth.uninstall_filter(FF.filter_id)

    startBlock = toBlock + 1
    do_checkpoint()

  logger.debug("Caught up to L1 tip. Waiting for new events from startBlock " + str(startBlock))
  FF = rpc[1].eth.filter({
      "fromBlock":startBlock,
      "toBlock":'latest',
      "address":scc_addr,
      "topics":[topic_sig]
  })

  while True:
    # FIXME - if the L1 node restarts, this can fail with "filter not found". May want to
    # put some retry/recovery logic inside this utility rather than relying on an external
    # service to restart it.
    try:
      for event in FF.get_new_entries():
        doEvent(event)
      do_checkpoint()
    except Exception as e:
      logger.error("get_new_entries() failed: " + str(e))
      if "filter not found" in str(e):
        logger.warning("Attempting to reinstall filter from checkpoint " + str(checkpoint))
        rCount = checkpoint[0]
        startBlock = checkpoint[1]

        FF = rpc[1].eth.filter({
            "fromBlock":startBlock,
            "toBlock":'latest',
            "address":scc_addr,
            "topics":[topic_sig]
        })
    time.sleep(30)
  logger.info("Exiting")

fpLoop()
