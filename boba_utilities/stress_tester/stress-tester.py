#!python
#
# Copyright 2021 mmontour@enya.ai. Internal use only; all rights reserved
#
# L1/L2 stress tester. Starts with one funded "funder" account which allocates
# funds to various child processes. The child processes then randomly perform
# various operations like onboarding L1->L2, exiting L2->L1, staking liquidity
# pools, or sending payments to each other. More capabilities can be added
# in the future e.g. trading ERC20 tokens, simulated gambling, auctions, 
# multi-level marketing where a child account recruits others and then collects
# a fee on their future transactions, ...
#
# Child processes will only be performing one action at a time, chosen randomly
# and with probabilities intended to keep most of the activity on the L2 chain.
# However some L1 operations are included to ensure that there is some background
# activity which is not part of the rollup framework.

import os,sys
from web3 import Web3
import threading
import signal
import time
from random import *
import queue
import requests,json
from web3.gas_strategies.time_based import fast_gas_price_strategy
from web3.middleware import geth_poa_middleware
from web3.logs import STRICT, IGNORE, DISCARD, WARN
import logging

from utils import Account,Addrs,Context,LoadEnv,lPrint,wPrint

num_workers = 1
min_active_per = 5  # For every <min_active_per> children, require 1 to stay on L2 (disallows exit operations)
max_fail = 0 # Ignore this many op failures. Next one will start a shutdown

min_balance = Web3.toWei(0.025, 'ether')
fund_balance = Web3.toWei(0.5, 'ether')

min_lp_balance = Web3.toWei(11.0, 'ether')

# Emit warning messages if any child has been waiting "slow_secs" or more. Shut down at "stuck_secs". 
slow_secs = 600
stuck_secs = 1800
giveup_secs = 2700
fund_batch = 10

if len(sys.argv) < 3:
  print("Usage:",sys.argv[0],"<target> <num_children>")
  exit(1)

num_children = int(sys.argv[2])
assert(num_children <= 1000) # Not a hard limit, but does affect log formatting

env = LoadEnv()
A = Addrs(env)
boba_addrs = A.boba_addrs

# Fail if the parameters would exceed the allowed funding limit
assert(num_children * (min_balance * 10) <= Web3.toWei(env['max_fund_eth'],'ether'))

class Child:
  def __init__(self, A, num, acct, parent):
     
    self.num = num
    self.acct = acct
    # Optional parameter to force all children to start on one chain
    if 'start_chain' in env and env['start_chain'] > 0:
      self.on_chain = env['start_chain']
    else:
      self.on_chain = 2 - (self.num % 2)
    self.approved = [False]*3
    self.staked = [False]*3
    self.staked_NG = False
    self.parent = parent
    self.ts = []
    self.op = None
    self.need_tx = False
    self.exiting = False
    self.gasEstimate = 0
    self.gasUsed = 0
    self.preload = [] # Override the RNG to step through a repeatable sequence of operations

    A.addr_names[acct.address] = "Child_" + str(num)
    # Could cache L1, L2 balances
    
  def buildAndSubmit(self, ctx, func, params):
    params['from'] = self.acct.address
    params['nonce'] = ctx.rpc[self.on_chain].eth.get_transaction_count(self.acct.address)
    params['chainId'] = ctx.chainIds[self.on_chain]

    gp = ctx.rpc[self.on_chain].eth.gasPrice

    if self.on_chain == 1:
      params['maxFeePerGas'] = gp
      # FIXME - get from env
      params['maxPriorityFeePerGas'] = min(Web3.toWei(1,'gwei'), gp)

    tx = func.buildTransaction(params)
    #print("TX",tx)
    self.gasEstimate = tx['gas']

    # FIXME - get gasMultiplier from env
    if self.on_chain == 1:
#      tx['gas'] = int(tx['gas'] * 2.0)
      tx['gas'] = int(tx['gas'] + 50000)

    ret = None
    try:
      signed_tx = ctx.rpc[self.on_chain].eth.account.sign_transaction(tx, self.acct.key)
      ret = ctx.rpc[self.on_chain].eth.send_raw_transaction(signed_tx.rawTransaction)
    except Exception as e:
      # FIXME - check for gas-price error specifically.
      print("***FAILED Sumbission, will retry once")
      if self.on_chain == 2:
        print("Old gas price:", tx['gasPrice'])
        tx['gasPrice'] = ctx.rpc[self.on_chain].eth.gasPrice
        print("New gas price:", tx['gasPrice'])
        signed_tx = ctx.rpc[self.on_chain].eth.account.sign_transaction(tx, self.acct.key)
        ret = ctx.rpc[self.on_chain].eth.send_raw_transaction(signed_tx.rawTransaction)
    return ret

class shutdown:
  level = 0
  num_done = 0
  num_fails = 0
  total_ops = 0  # FIXME - saving time by sticking this here. Move to its own stats object or other thread-safe place.
  batchGas = 0

def nuke(sec):
  print("*** Forced exit in ",sec,"seconds ***")
  # could try to flush buffers, close files, etc
  time.sleep(sec)
  os._exit(1)

def myAssert(cond):
  if not (cond) and shutdown.level < 2:
    shutdown.level = 2
    threading.Thread(target=nuke, args=(10,)).start()
  assert(cond)

def ctrlC(sig, frame):
  print("SIGNAL",sig,frame)
  shutdown.level += 1

  if shutdown.level >= 2:
    signal.signal(signal.SIGINT, signal.SIG_DFL)

  print("")
  print("+---------------------+")
  print("Shutdown level: ", shutdown.level)
  print("listLock:", listLock.locked())
  print("txWatch items:", len(txWatch))
  if shutdown.level > 1:
    for i in txWatch.keys():
      print("  ",Web3.toHex(i))
  print("evMissed: ", evMissed)
  print("evWatch items:", len(evWatch))
  if shutdown.level > 1:
    for i in evWatch.keys():
      print("  ",i)
  print("readyQueue size:", readyQueue.qsize())
  print("idleQueue size:", idleQueue.qsize())
  print("numDone:", shutdown.num_done,"of",num_children)
  if shutdown.level > 1:
    for c in children:
      if not c.exiting:
        print("*** Child",c.num,"acct",c.acct.address,"in op",c.op,"on chain",c.on_chain,"ts",c.ts,"need_tx",c.need_tx)
        
  print("+---------------------+")
  print("")

signal.signal(signal.SIGINT, ctrlC)

listLock = threading.Lock()
evWatch = dict()
txWatch = dict()
evMissed = []

readyQueue = queue.Queue()
idleQueue = queue.Queue()

os.makedirs("./logs", exist_ok=True)
account_log = open("./logs/accounts-" + env['name'] + ".log","a")
logLock = threading.Lock()

op_log = open("./logs/op.log","a")
op_log.write("# Started at " + time.asctime(time.gmtime()) + " with " + str(num_children)+ " children and " + str(num_workers) + " worker threads\n")

addrs = []
children = []

gasPrice = [0]*3
# Rinkeby seems to work at 0.5 gwei, ~75s
gasPrice[1] = Web3.toWei(env['gas_price_gwei'][0],'gwei')  # FIXME - try to estimate it (fails on local network)
gasPrice[2] = Web3.toWei(env['gas_price_gwei'][1],'gwei') # This one is fixed

funder = Account(Web3.toChecksumAddress(env['funder_acct'][0]),env['funder_acct'][1])

gCtx = Context(env,A,"./logs/mainloop.log","M")
lPrint (gCtx.log, "Versions: L1=" + gCtx.rpc[1].clientVersion + ", L2=" + gCtx.rpc[2].clientVersion)
lPrint (gCtx.log, "Detected chain IDs: L1=" + str(gCtx.chainIds[1]) + ", L2=" + str(gCtx.chainIds[2]))

funder.setNonces(gCtx.rpc)

def Fund(ctx, fr, to, chain, amount, n=None):

  if n is None:
    n = ctx.rpc[chain].eth.get_transaction_count(fr.address)
  tx = {
      'nonce': n,
      'from':fr.address,
      'to':to,
      'gas':21000,
      'chainId': ctx.chainIds[chain],
  }
  #tx['gasPrice'] = gasPrice[chain]
  tx['gasPrice'] = ctx.rpc[chain].eth.gasPrice

  myAssert(21000*tx['gasPrice'] < amount)
  tx['value'] = Web3.toWei(amount - 21000*tx['gasPrice'], 'wei')
  #print("FundTX",tx)

  signed_txn = ctx.rpc[chain].eth.account.sign_transaction(tx, fr.key)
  ret = ctx.rpc[chain].eth.send_raw_transaction(signed_txn.rawTransaction)

  return ret

def xFund(ctx, c, to, amount, n=None):
  amount -= randint(0,65535)
  if n is None:
    n = ctx.rpc[c.on_chain].eth.get_transaction_count(c.acct.address)
  tx = {
      'nonce': n,
      'from':c.acct.address,
      'to':to,
      'gas':21000,
      'chainId': ctx.chainIds[c.on_chain],
  }

  c.gasEstimate = 21000
  tx['gasPrice'] = ctx.rpc[c.on_chain].eth.gasPrice

  myAssert(21000*tx['gasPrice'] < amount)
  tx['value'] = Web3.toWei(amount - 21000*tx['gasPrice'], 'wei')

  signed_txn = ctx.rpc[c.on_chain].eth.account.sign_transaction(tx, c.acct.key)
  ret = ctx.rpc[c.on_chain].eth.send_raw_transaction(signed_txn.rawTransaction)

  return ret

def Start(ctx, c, op):
  myAssert(c.op is None)
  myAssert(not c.ts) # Ensure it's empty
  c.op = op
  c.gasEstimate = 0
  c.gasUsed = 0

  c.ts.append(time.time())
  s = "OP_START," + "{:03d}".format(c.num) + "," + op + "," + str(c.on_chain) + "," + "{:.8f}".format(c.ts[0])
  s += "\n"

  logLock.acquire()
  op_log.write(s)
  op_log.flush()
  logLock.release()

# Register the txhash to watch for. All watched operations do this
def Watch(ctx, c, op, tx=None):
  #print("Child",c.num,"START for", op)

  c.ts.append(time.time())

  s = "OP_WATCH," + "{:03d}".format(c.num) + "," + op + "," + str(c.on_chain) 
  start_at = c.ts[0]

  s += "," + "{:014.8f}".format(c.ts[1] - start_at)
  if tx:
    c.need_tx = True
    listLock.acquire()
    txWatch[tx] = c
    listLock.release()
    s = s + "," + Web3.toHex(tx)
  s = s + "\n"
  #ctx.log.write(s)
  logLock.acquire()
  op_log.write(s)
  op_log.flush()
  logLock.release()

# Wrapper to watch for an event as well as a tx receipt
def WatchEv(ctx, c, op, tx=None):
  myAssert(tx is not None)

  listLock.acquire()
  evWatch[c.acct.address] = c
  listLock.release()
  Watch(ctx, c, op, tx)

def Finish(c,success=1):
  myAssert(c.op)
  tNow = time.time()
  c.ts.append(tNow)

  op_str = "OP_DONE_," + "{:03d}".format(c.num) + "," + c.op + "," + str(c.on_chain) + "," + str(success)
  op_str += "," + str(c.gasUsed) + "/" + str(c.gasEstimate)
  if c.gasUsed > c.gasEstimate:
    print("*** Used more gas than estimate, child",c.num,"op",c.op)
    op_str += "<<<"
  c.gasEstimate = 0
  c.gasUsed = 0

  start_at = c.ts.pop(0)
  for t in c.ts:
    op_str += "," + "{:014.8f}".format(t - start_at)
  op_str += "\n"

  logLock.acquire()

  shutdown.total_ops += 1

  op_log.write(op_str)
  op_log.flush() 
  logLock.release()
  old_op = c.op

  c.ts = []
  c.op = None

  if c.exiting:
    print("Child",c.num,"is done")
    shutdown.num_done += 1
  elif success:
    readyQueue.put(c)
  else:
    print("Putting child",c.num,"into idleQueue after failed operation:", old_op)
    shutdown.num_fails += 1
    if shutdown.num_fails > max_fail and shutdown.level == 0: 
      print("*** Maximum failure count reached, starting shutdown")
      shutdown.level = 1
    idleQueue.put(c)

# Periodically take a child out of the idleQueue and see if it has gained enough funds to be put back
# into the readyQueue.
def idle_manager(env):
  loopCheck = None
  while shutdown.level < 2:
    c = None
    items = idleQueue.qsize()

    if items == 0:
      #print("idle_manager idleQueue empty")
      time.sleep(20)
      continue

    c = idleQueue.get()
    if shutdown.level > 0:
      readyQueue.put(c)
      continue

    bal = gCtx.rpc[2].eth.get_balance(c.acct.address)
    if bal >= min_balance:
      c.on_chain = 2
      print("idle_manager re-activating child",c.num,"on chain", c.on_chain)
      loopCheck = None
      readyQueue.put(c)
      continue

    bal = gCtx.rpc[1].eth.get_balance(c.acct.address)
    if bal >= min_balance:
      c.on_chain = 1
      print("idle_manager re-activating child",c.num,"on chain", c.on_chain)
      loopCheck = None
      readyQueue.put(c)
      continue

    interval = 2
    if loopCheck is None:
      loopCheck = c.num
    elif loopCheck == c.num:
      interval = 20
      loopCheck = None
      # If every child is idle and we've scanned the whole queue once, might as well quit.
      if idleQueue.qsize() >= num_children and shutdown.level == 0:
        print("Welp, looks like we're done here.")
        shutdown.level = 1

    idleQueue.put(c)
    #print("idle_manager did not reactivate child",c.num,",will sleep for", interval)
    time.sleep(interval)
  print("idle_manager done")

def AddLiquidity(ctx, c,amount):
  if c.staked[c.on_chain]:
    # FIXME - do a withdrawal in this case
    lPrint(ctx.log, "Child " + str(c.num) + " alredy staked on chain " + str(c.on_chain) + " in AddLiquidity (NOP)")
    readyQueue.put(c)
  else:
    Start(ctx, c, "AL")

    LP = None
    token = None
    if (c.on_chain==1):
      LP = ctx.contracts['LP_1']
      token = '0x0000000000000000000000000000000000000000'
    else:
      LP = ctx.contracts['LP_2']
      token = '0x4200000000000000000000000000000000000006'

    t2 = LP.functions.addLiquidity(
      amount,
      token,
    )

    r = c.buildAndSubmit(ctx, t2, {'value': amount})

    c.staked[c.on_chain] = True
    Watch(ctx, c, "AL", r)

def AddLiquidity_NG(ctx, c,amount):
  if c.staked_NG:
    amount = c.staked_NG
    Start(ctx, c, "RN")
    LP = ctx.contracts['L1_EthPool']
    token = '0x0000000000000000000000000000000000000000'

    t2 = LP.functions.withdrawLiquidity(
      amount,
      token,
      c.acct.address
    )
    r2 = c.buildAndSubmit(ctx, t2, {})

    c.staked_NG = 0
    Watch(ctx, c, "RN", r2)
  else:
    Start(ctx, c, "AN")
    LP = ctx.contracts['L1_EthPool']
    token = '0x0000000000000000000000000000000000000000'

    t2 = LP.functions.addLiquidity(
      amount,
      token,
    )

    r2 = c.buildAndSubmit(ctx, t2, {'value':amount})
    c.staked_NG = amount
    Watch(ctx, c, "AN", r2)

def AddLiquidity_2(ctx, chain, acct,amount):
  chainId = 0
  token = None
  if (chain==1):
    LP = ctx.contracts['LP_1']
    token = '0x0000000000000000000000000000000000000000'
  else:
    LP = ctx.contracts['LP_2']
    token = '0x4200000000000000000000000000000000000006'
  t2 = LP.functions.addLiquidity(
    amount,
    token,
  )
  t = t2.buildTransaction({
    'from':acct.address,
    'nonce':ctx.rpc[chain].eth.get_transaction_count(acct.address),
    'chainId': ctx.chainIds[chain],
    'value':amount
  })

  signed_tx = ctx.rpc[chain].eth.account.sign_transaction(t, acct.key)
  r = ctx.rpc[chain].eth.send_raw_transaction(signed_tx.rawTransaction)
  return r

# FIXME - this is used by the Funder to transfer L1->L2 if needed on startup. Can't quite unify it with 
# the Onramp_trad code path used by the workers.
def Onramp_2(ctx, acct, amount):
  chain = 1

  sb = ctx.contracts['SB_1'].functions.depositETH(
    8000000,  # FIXME / ref: 100000 == MIN_ROLLUP_TX_GAS from OVM_CanonicalTransactionChain.sol
              # Values like 8*MIN can fail silently, successful Tx on L1 but no event ever on L2
              # 8000000 works sometimes(?)
    '0x',
  )

  t = sb.buildTransaction({
    'from':acct.address,
    'nonce':ctx.rpc[chain].eth.get_transaction_count(acct.address),
    'chainId': ctx.chainIds[chain],
    'value':amount
  })

  signed_tx = ctx.rpc[chain].eth.account.sign_transaction(t, acct.key)
  ret = ctx.rpc[chain].eth.send_raw_transaction(signed_tx.rawTransaction)

  return ret

def Onramp_trad(ctx,c):
  Start(ctx,c,"SO")
  bb = ctx.rpc[1].eth.getBalance(c.acct.address)

  amount = Web3.toWei(bb, 'wei') - min_balance

  sb = ctx.contracts['SB_1'].functions.depositETH(
    8000000,  # FIXME / ref: 100000 == MIN_ROLLUP_TX_GAS from OVM_CanonicalTransactionChain.sol
              # Values like 8*MIN can fail silently, successful Tx on L1 but no event ever on L2
              # 8000000 works sometimes(?)
    '0x',
  )

  ret = c.buildAndSubmit(ctx, sb, {'value':amount})

  c.on_chain = 2
  WatchEv(ctx,c,"SO",ret)
   
def Onramp_fast(ctx,c):
  acct = c.acct
  chain = 1

  t = ctx.contracts['LP_2'].functions.poolInfo('0x4200000000000000000000000000000000000006').call()
  bb = ctx.rpc[1].eth.getBalance(acct.address) - min_balance

  if bb > (t[2] / 2.0):
    lPrint(ctx.log, "***** WARNING Child " + str(c.num) + " falling back to traditional onramp")
    Onramp_trad(acct)
  else:
    if True:
      Start(ctx,c,"FO")
      dep = ctx.contracts['LP_1'].functions.clientDepositL1(
        0,
        '0x0000000000000000000000000000000000000000'
      )

      r = c.buildAndSubmit(ctx, dep, {'value':bb})
      c.on_chain = 2
      WatchEv(ctx,c,"FO",r)

def Onramp_NG(ctx,c):
  acct = c.acct
  chain = 1
  amount = ctx.rpc[1].eth.getBalance(acct.address) - min_balance

  if False:
    lPrint(ctx.log, "***** WARNING Child " + str(c.num) + " falling back to traditional onramp")
  else:
    if True:
      Start(ctx,c,"UO")
      dep = ctx.contracts['L1_EthPool'].functions.clientDepositL1(
        0,
        '0x0000000000000000000000000000000000000000'
      )

      r = c.buildAndSubmit(ctx, dep, {'value':amount})
      c.on_chain = 2

      WatchEv(ctx,c,"UO",r)

def SlowExit(ctx,c, ng):
  if ng:
    cn='L2_BobaPortal'
    optype="SN"
  else:
    cn='SB_2'
    optype="SX"

  Start(ctx,c,optype)
  chain = 2
  amount = Web3.toWei(ctx.rpc[2].eth.getBalance(c.acct.address) - min_balance, 'wei')
  print("DBG Amount",amount,"of", Web3.toWei(ctx.rpc[2].eth.getBalance(c.acct.address), 'wei'))

  t = ctx.contracts[cn].functions.withdraw(
    '0x4200000000000000000000000000000000000006',
    amount,
    0,  # L1-gas, unused
    '0x41424344',
  )
  r = c.buildAndSubmit(ctx, t, {})
  c.on_chain = 1
  WatchEv(ctx,c,optype,r)

def FastExit(ctx, c, ng):
  if ng:
    cn= 'L2_EthPool'
    optype="FN"
  else:
    cn='LP_2'
    optype="FX"
    t = ctx.contracts['LP_1'].functions.poolInfo('0x0000000000000000000000000000000000000000').call()

  bb = ctx.rpc[2].eth.getBalance(c.acct.address)

  if ng and bb > (ctx.contracts['L2_EthPool'].functions.safeL1Balance().call() / 2.0):
    print("Falling back to NG slow exit")
    SlowExit(ctx,c,ng)
  elif ng == False and bb > (t[2] / 2.0):
    print("Falling back to traditional exit")
    SlowExit(ctx,c,ng)
  else:
    Start(ctx,c,optype)  
    amount = Web3.toWei(bb - min_balance, 'wei')

    print("DBG exit amount = ",amount,"bb",bb)

    dep = ctx.contracts[cn].functions.clientDepositL2(
      amount,
      '0x4200000000000000000000000000000000000006'
    )

    r = c.buildAndSubmit(ctx, dep, {'value':Web3.toWei(amount,'wei')})

    c.on_chain = 1
    WatchEv(ctx,c,optype,r)

def SendFunds(ctx, c):

  bal = ctx.rpc[c.on_chain].eth.getBalance(c.acct.address) # FIXME - cache this in the Child structure

  idx = randint(0,len(addrs)-1)
  if (addrs[idx] == c.acct.address):
    lPrint(ctx.log, "Child " + str(c.num) + " NOP on chain " + str(c.on_chain))
    readyQueue.put(c)
  else:
    Start(ctx,c,"PY")
    tt = xFund(ctx, c, addrs[idx], bal / 10.0)
    myAssert(tt not in txWatch)
    Watch(ctx,c,"PY",tt)

def StopChild(ctx, c):
  print("StopChild",c.num,"op",c.op)
  for ch in range(1,3):
    # FIXME - try removing liquidity instead, if staked on either chain.
    if c.staked[ch] or c.staked_NG:
      pass
    b = ctx.rpc[ch].eth.getBalance(c.acct.address)
    lPrint(ctx.log, "StopChild " + str(c.num) + " chain " + str(ch) + " balance " + str(b))
    if b > min_balance:
      try:
        Start(ctx,c,"RF")
        r = Fund(ctx, c.acct, c.parent, ch, Web3.toWei(b - min_balance, 'wei'))
        c.gasEstimate = 21000
        lPrint(ctx.log, "Child " + str(c.num) + " refunding " + str(Web3.fromWei(b,'ether')) + " to " + c.parent + " on chain " + str(ch) + " tx " + Web3.toHex(r))
        Watch(ctx,c,"RF",r)
      except Exception as e:
        lPrint(ctx.log, "ERROR Refund attempt failed for child " + str(c.num) + " on chain " + str(ch) + " error " + str(e))
        Finish(c, False)
        continue
      return
    else:
      lPrint(ctx.log, "Child " + str(c.num) + " is below minimum refund balance on chain " + str(ch))
  Start(ctx, c,"DN")
  Watch(ctx, c,"DN")
  c.exiting = True
  Finish(c)

# Create a child process and give it 1/2 of my balance
def SpawnChild(ctx,c):
  # FIXME - not yet implemented
  # Create a new Child process. Update num_children, add to list
  # Start a Fund transaction
  pass

def RollDice(ctx, c, prob):
  if len(c.preload) > 0:
    if c.preload[0] > 0:
      c.preload[0] -= 1
      ret = False
    else:
      c.preload.pop(0)
      s = "Overriding RNG for child " + str(c.num) + ", " + str(len(c.preload)) + " more operations pending"
      lPrint(ctx.log, s)
      return True
    return ret
  num = randint(0,100)
  if num < prob:
    ret = True
  else:
    ret = False
  #print("dice",num,"/",prob,ret)
  return ret

def dispatch(ctx, prefix, c):
    if c.on_chain == 1:
      # ERC20 approval not presently needed on L1

      if RollDice(ctx,c,env['op_pct'][0][0]):
        bal = ctx.rpc[c.on_chain].eth.getBalance(c.acct.address)
        lPrint(ctx.log, prefix + "will add/remove liquidity")
        AddLiquidity(ctx, c, Web3.toWei(bal / 4.0,'wei'))
      elif RollDice(ctx,c, env['op_pct'][0][1]):
        lPrint(ctx.log, prefix +  "will fast-onramp")
        Onramp_fast(ctx, c)
      elif RollDice(ctx,c, env['op_pct'][0][2]):
        lPrint(ctx.log, prefix + "will traditonal-onramp")
        Onramp_trad(ctx, c)    
      elif RollDice(ctx,c, env['op_pct'][0][3]):
        bal = ctx.rpc[c.on_chain].eth.getBalance(c.acct.address)
        if c.staked_NG:
          lPrint(ctx.log, prefix + "will remove NG liquidity")
        else:
          lPrint(ctx.log, prefix + "will add NG liquidity")
        AddLiquidity_NG(ctx, c, Web3.toWei(bal / 4.0,'wei'))
      elif RollDice(ctx,c, env['op_pct'][0][4]):
        lPrint(ctx.log, prefix + "will use NG unified onramp")
        Onramp_NG(ctx, c)    
      else:
       lPrint(ctx.log, prefix + "Will send funds")
       SendFunds(ctx, c)
    else:
      if not c.approved[2]:
        lPrint(ctx.log, prefix + "Approving contracts")
        # Currently synchronous, could do multi-step waits for completion 
        Approve(ctx, boba_addrs['Proxy__L2LiquidityPool'], c.acct)
        if env['ng_enabled']:
          Approve(ctx, boba_addrs['L2_EthPool'], c.acct)
          Approve(ctx, boba_addrs['L2_BobaPortal'], c.acct)
        Approve(ctx, '0x4200000000000000000000000000000000000010', c.acct)
        c.approved[2] = True
        readyQueue.put(c)
        return

      mayExit = True
      minActive = int(num_children / min_active_per)
      if (len(evWatch) + idleQueue.qsize()) >= (num_children - minActive):
        mayExit = False

      if RollDice(ctx,c,env['op_pct'][1][0]):
        bal = ctx.rpc[c.on_chain].eth.getBalance(c.acct.address)
        lPrint(ctx.log, prefix + "will add/remove liquidity")
        AddLiquidity(ctx, c, Web3.toWei(bal / 4.0,'wei'))
      elif mayExit and RollDice(ctx,c, env['op_pct'][1][1]):
        lPrint(ctx.log, prefix + "will fast-exit")
        r = FastExit(ctx, c, False)
      elif mayExit and RollDice(ctx,c, env['op_pct'][1][2]):
        lPrint(ctx.log, prefix + "will slow-exit")
        SlowExit(ctx, c,False)
      elif mayExit and RollDice(ctx,c, env['op_pct'][1][3]):
        lPrint(ctx.log, prefix + "will NG fast-exit")
        r = FastExit(ctx, c, True)
      elif mayExit and RollDice(ctx,c, env['op_pct'][1][4]):
        lPrint(ctx.log, prefix + "will NG slow-exit")
        SlowExit(ctx, c, True)
      else:
        lPrint(ctx.log, prefix + "Will send funds")
        SendFunds(ctx, c) 

def worker_thread(env, A, num, cx, ch):
  ctx = Context(env, A, "./logs/worker-"+str(num)+".log",None)

  wasBusy = True
  while shutdown.num_done < num_children and shutdown.level < 2:
    c = None

    try:
      c = readyQueue.get(False)
      wasBusy = True
    except:
      if wasBusy:
        lPrint(ctx.log, "Worker " + str(num) + " readyQueue is empty")
        wasBusy = False

    if not c:  
      time.sleep(2)
      continue

    b1 = ctx.rpc[1].eth.getBalance(c.acct.address)
    b2 = ctx.rpc[2].eth.getBalance(c.acct.address)

    # Request funding if necessary
    bal = ctx.rpc[c.on_chain].eth.getBalance(c.acct.address)

    if shutdown.level > 0:
      StopChild(ctx, c)  # A child might get here several times before it's done
      continue

    prefix = "W " + str(num) + " ch " + str(c.on_chain) + " Child " + str(c.num) + " "

    s = prefix + "dispatching at " + str(time.time()) + " b1 " + str(Web3.fromWei(b1,'ether'))
    s +=  " b2 " + str(Web3.fromWei(b2,'ether')) + " L2_Share " + str(int(100*b2/(b1+b2))) + "%"
    s += " Total " + str(Web3.fromWei(b1+b2,'ether'))
    lPrint(ctx.log, s)

    if (bal >= min_balance):
      pass
    elif c.on_chain == 1 and b2 >= min_balance:
      lPrint(ctx.log, prefix + "balance low, switching to chain 2")
      c.on_chain = 2
    elif c.on_chain == 2 and b1 >= min_balance:
      lPrint(ctx.log, prefix + "balance low, switching to chain 1")
      c.on_chain = 1
    else:  
      lPrint(ctx.log, prefix + "has insufficient funding on either chain")
      idleQueue.put(c)
      continue

    dispatch(ctx, prefix, c)
    ctx.log.flush() 
    time.sleep(env['op_delay'])

  ctx.log.write("# Finished at " + time.asctime(time.gmtime()) + "\n")
  ctx.log.flush()
  lPrint(ctx.log, "Thread " + str(num) + " done")

lPrint(gCtx.log, "Funder L2 balance " + str(Web3.fromWei(gCtx.rpc[2].eth.getBalance(funder.address),'ether')) + " nonce " + str( gCtx.rpc[2].eth.get_transaction_count(funder.address)))

threads = []
l1PayQueue = queue.Queue()
l2PayQueue = queue.Queue()

def Approve(ctx, contract, acct):
  return; # FIXME - no longer oETH
  allowance = ctx.contracts['oETH'].functions.allowance(acct.address,contract).call()

  if Web3.fromWei(allowance,'ether') > 1000:
    lPrint(ctx.log, "Approval not needed, allowance=" + str(allowance))
    return

  a = ctx.contracts['oETH'].functions.approve(
    contract,
    Web3.toWei(99999,'ether')
  )

  ret = c.buildAndSubmit(ctx, a, {})

  rcpt = ctx.rpc[2].eth.wait_for_transaction_receipt(ret)
  lPrint(ctx.log, "APPROVED addr " + acct.address + " FOR " + contract + " STATUS " + str(rcpt.status))
  myAssert(rcpt.status == 1)

def block_watcher(env, A, ch):
  ctx = Context(env, A, "./logs/watcher-L"+str(ch)+".log", str(ch))
  ctx.log.write("# Started at " + time.asctime(time.gmtime()) + "\n")

  w3 = ctx.rpc[ch]
  log = ctx.log

  next = w3.eth.block_number

  ctcCount = 0
  ctcGasUsed = 0
  sccCount = 0
  sccGasUsed = 0

  NP = None
  NS = None

  if ch == 1:
    FF = ctx.contracts['LP_1'].events.ClientPayL1()
    FS = ctx.contracts['SB_1'].events.ETHWithdrawalFinalized()
    FF_Err = ctx.contracts['LP_1'].events.ClientPayL1Settlement()
    if env['ng_enabled']:
      NP = ctx.contracts['L1_BobaPortal'].events.ETHWithdrawalFinalized()
      NS = ctx.contracts['L1_EthPool'].events.PoolPaidL1()
  else:
    FF = ctx.contracts['LP_2'].events.ClientPayL2()
    FS = ctx.contracts['SB_2'].events.DepositFinalized()
    if env['ng_enabled']:
      NP = ctx.contracts['L2_EthPool'].events.PoolPaidL2()
     
  while shutdown.level < 2:
    while (next + env['confirmations'][ch-1]) > w3.eth.block_number and shutdown.level < 2:
      time.sleep(3)

    if shutdown.level >= 2:
      break
    b = None

    try:
      b = w3.eth.get_block(next,full_transactions=True)
    except:
      print("***ERR failed to get block",next,"on chain",ch)
      time.sleep(5)
      continue

    header =  "New block " + str(next) + " at " + str(time.time())
    if len(b.uncles) > 0:
      print("***WARNING - block has uncles:",b.uncles)
      header += "[UNCLES]"
      
    if len(b.transactions) == 0:
      header += " [No transactions]"
      wPrint(log, ch, header)
      wPrint(log, ch, "")
      next += 1
      continue

    if ch == 2:
      tx = b.transactions[0]
      header += " at L1_BN=" + str(int(tx.l1BlockNumber,16)) + ", L1_TS=" + str(int(tx.l1Timestamp,16))
      if tx.l1TxOrigin:
        header += ", l1QueueOrigin=" + A.addrName(Web3.toChecksumAddress(tx.l1TxOrigin))
    wPrint(log, ch, header)

    ign_count = 0
    for tx in b.transactions:
      logs = []
      t = tx.hash

      listLock.acquire()
      if t in txWatch: # Receipt for one of our direct transactions
        success=1
        tr=None
        try:
          tr = w3.eth.get_transaction_receipt(t)
        except Exception as e:
          print("eth.get_transaction_receipt exception:", e)
          wPrint(log,ch,"ERROR fetching receipt, will re-try once.")
          time.sleep(10)
          tr = w3.eth.get_transaction_receipt(t)

        logs = tr.logs
        cc = txWatch.pop(t)
        cc.need_tx = False
        wPrint(log, ch, "got TX " + Web3.toHex(t) + " child " + str(cc.num) + " addr " + cc.acct.address + " S " + str(tr.status))
        cc.gasUsed = tr.gasUsed

        if tr.status != 1:
          success = 0
          wPrint(log, ch, "ERROR Failed TX " + Web3.toHex(t) + " child " + str(cc.num) + " addr " + cc.acct.address)
          print("FAILED_TX",tx)
          print("FAILED_TX_RCPT",tr)

          if cc.acct.address in evWatch:
            wPrint(log, ch, "Removing " + cc.acct.address + "from evWatch after failed TX")
            evWatch.pop(cc.acct.address)
          #assert(tr.status == 1)
        cc.ts.append(time.time())
        if cc.acct.address in evWatch:

          print("Child", cc.num, "tx OK, waiting for event")
        else:
          Finish(cc,success)

      elif tx['from'] in A.addr_names or tx['to'] in A.addr_names: # System-generated  transactions
        tr = w3.eth.get_transaction_receipt(t)
        logs = tr.logs
        items = ['from', 'to', 'address', 'gasUsed', 'gas', 'nonce', 'value', 'status' ]
        pr = {}
        for i in items:
          if i in tr:
            val = tr[i]
          elif i in tx:
            val = tx[i]
          else:
            continue  
          pr[i] = A.addrName(val)
        if 'gas' in pr and 'gasUsed' in pr:
          if pr['gasUsed'] > pr['gas']:
            wPrint(log, ch, "*** GAS MISMATCH, gasUsed " + str(pr['gasUsed']) + " > gas " + str(pr['gas']))
     
        wPrint(log, ch, "sys TX " + Web3.toHex(t) + " " + str(pr))

        if pr['to'] == 'CanonicalTransactionChain':
          ctcCount += 1
          ctcGasUsed += pr['gasUsed']
        elif pr['to'] == 'StateCommitmentChain':
          sccCount += 1
          sccGasUsed += pr['gasUsed']
      else:
        ign_count += 1
        wPrint(log, ch, "ign TX " + Web3.toHex(t), False)

      for j in logs:
        topic_args = []
        for k in j.topics[1:]:
          topic_args.append(Web3.toHex(k) + " ")
        wPrint(log, ch, "    (EVENT) " + A.addrName(j.address) + " " + ctx.nameSig(Web3.toHex(j.topics[0])) + " " + str(topic_args))

        match=None
        ev=None
        success=1
        try:
          ev = FF.processLog(j)
          match = ev.args['sender']
        except:
          pass
        try:
          ev = FS.processLog(j)
          match = ev.args['_to']
        except:
          pass
        try:
          ev = NP.processLog(j)
          match = ev.args['_to']
        except:
          pass
        if ch == 1:
          try:
            ev = NS.processLog(j)
            match = ev.args['_to']
          except:
            pass
          try:
            ev = FF_Err.processLog(j)
            match = ev.args['sender'] # FIXME - appears as '_to' in some versions of contract???
            wPrint(log,ch,"     *****  WARNING Failed fast-onramp for addr " + match)
            success = 0
          except:
            pass

        if match in evWatch:
          c = evWatch.pop(match)
          wPrint(log,ch, "        --> Matched evWatch child " + str(c.num) + " addr " + match)
          if c.need_tx:
            wPrint(log,ch, "            NOTE got event before tx for addr " + match) # This is no longer a warning; should be handled OK, and happens if Confirmations is set higher than the DTL value
          else:
            Finish(c,success)
        elif match in addrs:  
          wPrint(log,ch, "     *****  WARNING Found unmatched event for addr " + match)
          evMissed.append(match)
        elif match == funder.address:
          wPrint(log,ch, "       -->  Ignoring event for Funder addr " + match)
        elif match:
          wPrint(log,ch, "     *****  WARNING Ignoring event for unknown addr " + match)
      listLock.release()
    if ign_count > 0:
      # FIXME - there is a small race condition where a txn could go through before the
      # txhash is registered. Should keep a history of ignored txns and cross-reference
      # against the txWatch. 
      wPrint(log, ch, "ignored " + str(ign_count) + " foreign transactions")

    listLock.acquire()
    for e in evMissed:
      if e in evWatch:
        c = evWatch.pop(e)
        wPrint(log, ch, "WARNING previous event " + e + " now matches child " + str(c.num))
        evMissed.remove(e)
        Finish(c, success)
    listLock.release()

    wPrint(log,ch, "")
    log.flush()
    try: # can get "broken pipe" with "tee"
      sys.stdout.flush()
    except:
      pass  
    next += 1

    if (next % 10) == 0 and ch == 1 and ctcCount > 0 and sccCount > 0:
      ctcAvg = int(ctcGasUsed / ctcCount)
      sccAvg = int(sccGasUsed / sccCount)
      s =  "+++ GAS_STATS +++ CTC has used " + str(ctcGasUsed) + " gas in " + str(ctcCount) + " tx (avg " + str(ctcAvg) + ")"
      s += "; SCC has used " + str(sccGasUsed) + " gas in " + str(sccCount) + " tx (avg " + str(sccAvg) + ")"
      wPrint(log, ch, s)

  # Print final stats on thread exit.
  if ch == 1 and ctcCount > 0 and sccCount > 0:  
    ctcAvg = int(ctcGasUsed / ctcCount)
    sccAvg = int(sccGasUsed / sccCount)
    s =  "+++ GAS_STATS_FINAL +++ CTC used total " + str(ctcGasUsed) + " gas in " + str(ctcCount) + " tx (avg " + str(ctcAvg) + ")"
    s += "; SCC used total " + str(sccGasUsed) + " gas in " + str(sccCount) + " tx (avg " + str(sccAvg) + ")"
    wPrint(log, ch, s)
    shutdown.batchGas = ctcGasUsed + sccGasUsed

  wPrint(log, ch, "Watcher thread done")

l1_watcher = threading.Thread(target=block_watcher, args=(env,A,1,))
l1_watcher.start()
l2_watcher = threading.Thread(target=block_watcher, args=(env,A,2,))
l2_watcher.start()
idle_mgr = threading.Thread(target=idle_manager, args=(env,))
idle_mgr.start()

# Ensure sufficient L2 balance
balStart = [None]*3
balStart[1] = gCtx.rpc[1].eth.getBalance(funder.address)
balStart[2] = gCtx.rpc[2].eth.getBalance(funder.address)
fvStart = gCtx.rpc[2].eth.getBalance('0x4200000000000000000000000000000000000011')

lPrint(gCtx.log, "Funder staring balances: L1=" + str(Web3.fromWei(balStart[1],'ether')) + " L2=" + str(Web3.fromWei(balStart[2],'ether')))
lPrint(gCtx.log, "Ratio: " + str(balStart[2] / (balStart[1] + balStart[2])))

if (balStart[2] / (balStart[1] + balStart[2])) < 0.4:
  diff = (balStart[1] + balStart[2])/2.0 - balStart[2]
  lPrint(gCtx.log, "Funder will move " + str(Web3.fromWei(diff,'ether')) + " from L1 to L2")

  diff = Web3.toWei(diff,'wei')
  tx = Onramp_2(gCtx,funder,diff)
  rcpt = gCtx.rpc[1].eth.wait_for_transaction_receipt(tx)
  myAssert(rcpt.status == 1)
  lPrint(gCtx.log, "Funder L1->L2 transfer completed on L1.")

  tries = 0
  while gCtx.rpc[2].eth.getBalance(funder.address) <= balStart[2]:
    lPrint(gCtx.log, "Waiting for transfer to arrive on L2")
    time.sleep(10)
    tries += 1
    myAssert(tries < 60)  
  lPrint(gCtx.log, "Funder L1->L2 transfer completed on L2. Recalculating start values.")

  balStart[1] = gCtx.rpc[1].eth.getBalance(funder.address)
  balStart[2] = gCtx.rpc[2].eth.getBalance(funder.address)
  lPrint(gCtx.log, "Updated staring balances: L1=" + str(Web3.fromWei(balStart[1],'ether')) + " L2=" + str(Web3.fromWei(balStart[2],'ether')))
  funder.setNonces(gCtx.rpc)

time.sleep(2)

Approve(gCtx, boba_addrs['Proxy__L2LiquidityPool'], funder)
Approve(gCtx, '0x4200000000000000000000000000000000000010', funder)

# Pre-fund the LPs if necessary
t = gCtx.contracts['LP_1'].functions.poolInfo('0x0000000000000000000000000000000000000000').call()
if t[2] < min_lp_balance:
  r = AddLiquidity_2(gCtx, 1, funder, min_lp_balance)
  rcpt = gCtx.rpc[1].eth.wait_for_transaction_receipt(r)
  lPrint(gCtx.log, "Added liquidity to LP[1], status " + str(rcpt.status))
  myAssert(rcpt.status == 1)
else:
  lPrint(gCtx.log, "LP[1] has sufficient liquidity: " + str(Web3.fromWei(t[2],'ether')))

t = gCtx.contracts['LP_2'].functions.poolInfo('0x4200000000000000000000000000000000000006').call()
if t[2] < min_lp_balance:
  r = AddLiquidity_2(gCtx, 2, funder, min_lp_balance)
  rcpt = gCtx.rpc[2].eth.wait_for_transaction_receipt(r)
  lPrint(gCtx.log, "Added liquidity to LP[2], status " + str(rcpt.status))
  myAssert(rcpt.status == 1)
else:
  lPrint(gCtx.log, "LP[2] has sufficient liquidity: " + str(Web3.fromWei(t[2],'ether')))

if env['ng_enabled']:  
  t = gCtx.contracts['L1_EthPool'].functions.availL1Balance().call()
  if t < min_lp_balance:

    token = '0x0000000000000000000000000000000000000000'

    t2 = gCtx.contracts['L1_EthPool'].functions.addLiquidity(
      min_lp_balance,
      token,
    ).buildTransaction({
      'nonce':gCtx.rpc[1].eth.get_transaction_count(funder.address),
      'from':funder.address,
      'value':min_lp_balance,
      'chainId':gCtx.chainIds[1],
    })

    st = gCtx.rpc[1].eth.account.sign_transaction(t2, funder.key)
    r = gCtx.rpc[1].eth.send_raw_transaction(st.rawTransaction) 

    rcpt = gCtx.rpc[1].eth.wait_for_transaction_receipt(r)
    lPrint(gCtx.log, "Added liquidity to L1_EthPool, status " + str(rcpt.status))
    myAssert(rcpt.status == 1)
  else:
    lPrint(gCtx.log, "L1_EthPool has sufficient liquidity: " + str(Web3.fromWei(t,'ether')))

funder.setNonces(gCtx.rpc)

# Process initial funding ops in batches to avoid overloading the L1 (Rinkeby)
def InitialFunding(env):
  lPrint(gCtx.log, "InitialFunding thread starting, num_children = " + str(len(children)))
  batchTx = []

  for c in children:
    lPrint(gCtx.log, "InitialFunding child " + str(c.num) + " addr " +  c.acct.address + " on chain " + str(c.on_chain))

    if shutdown.level > 0:
      lPrint(gCtx.log, "InitialFunding thread in shutdown, skipping child " + str(c.num))
      readyQueue.put(c)
      continue

    Start(gCtx, c, "IF")
    ret = Fund(gCtx, funder, c.acct.address, c.on_chain, fund_balance, funder.nonce[c.on_chain])
    c.gasEstimate = 21000

    funder.nonce[c.on_chain] += 1
    Watch(gCtx, c, "IF", ret)

    batchTx.append(ret)

    if (len(batchTx) >= fund_batch):
      lPrint(gCtx.log, "InitialFunding thread pausing for batch completion")
      tStart = time.time()
      while len(batchTx) > 0 and shutdown.level == 0:
        time.sleep(10)
        listLock.acquire()
        for t in batchTx:
          if t not in txWatch:
            lPrint(gCtx.log, "InitialFunding done for tx " + Web3.toHex(t))
            batchTx.remove(t)
        listLock.release()
        tWait = time.time() - tStart
        lPrint(gCtx.log, "InitialFunding thread still waiting for " + str(len(batchTx)) + " transactions after " + str(int(tWait)) + " secs")
        if tWait > stuck_secs and shutdown.level == 0:
          lPrint(gCtx.log, "InitialFunding thread triggering STUCK_OPERATION shutdown")
          shutdown.level = 1
  lPrint(gCtx.log, "InitialFunding thread done.")

for i in range(0,num_workers):  
  t = threading.Thread(target=worker_thread, args=(env, A, i,None,0,))
  threads.append(t)
  t.start()

# Make sure we have at least enough for the initial funding
myAssert(num_children * (min_balance * 10) < balStart[2])
fundCount = 0

for i in range(0,num_children):
  lPrint(gCtx.log, "Creating child account " + str(i))

  acct = gCtx.rpc[1].eth.account.create()
  addrs.append(acct.address)

  account_log.write(json.dumps({ 'addr':acct.address, 'key':Web3.toHex(acct.key) }))
  account_log.write("\n")

  c = Child(A,i,acct,funder.address)
  children.append(c)

  # If running a single child, it can optionally be sequenced through a fixed set of
  # operations before reverting to random selection.
  #
  # Preload ops: chain 1
  #  0 - Add/Remove LP liquidity
  #  1 - Fast LP onramp
  #  2 - Slow SB onramp
  #  3 - Add/remove NG liquidity
  #  4 - NG unified onramp
  # Chain 2:
  #  0 - Add/Remove LP liquidity
  #  1 - Fast LP exit
  #  2 - Slow SB exit
  #  3 - NG Fast exit
  #  4 - NG Slow exit
  if num_children == 1 and env['name'] == 'local':
    if env['ng_enabled'] and c.on_chain == 1:
      c.preload = [ 1, 1, 4, 4, 3, 4, 3, 3, 0, 2, 4, 4, 3 ] # Fast on, Fast off, NG on, NG-SB off, AddLiq, NG on, NG-LP off, RL-NG, AL, SB-on
      #c.preload = [ 4, 4, 4, 2 ]
      #c.preload = [ 3, 3 ]
    elif env['ng_enabled']:
      c.preload = [ 1, 1, 4, 3, 4, 3, 3, 0, 2, 4, 4, 3 ] # Fast off, Fast on, NG-SB off, AddLiq, NG on, NG-LP off, RL-NG, AL, SB-on
    elif c.on_chain == 1:
      c.preload = [ 0, 1, 1, 2, 2 ]
    else:
      c.preload = [ 2, 0, 2, 1, 1 ]

  s = "OP_INIT_," + "{:03d}".format(c.num) + ",--," + str(c.on_chain) + "," + c.acct.address
  s += "\n"

  logLock.acquire()
  op_log.write(s)
  logLock.release()

ifThread = threading.Thread(target=InitialFunding, args=(env,))
ifThread.start()

account_log.flush()

start_time = time.time()

while shutdown.level < 2:  
  c = None
  while c is None and shutdown.level < 2: # FIXME
    listLock.acquire()

    runtime = time.time() - start_time

    s = "Completed " + str(shutdown.total_ops) + " ops in " + str(runtime) + " seconds (" + str(int(3600 * shutdown.total_ops / runtime)) + "/hour)"
    lPrint(gCtx.log, s)

    ps = "Pool balances, TS " + str(time.time())
    ps += " LP1 " + str(Web3.fromWei(gCtx.contracts['LP_1'].functions.poolInfo('0x0000000000000000000000000000000000000000').call()[2],'ether'))
    ps += " LP2 " + str(Web3.fromWei(gCtx.contracts['LP_2'].functions.poolInfo('0x4200000000000000000000000000000000000006').call()[2],'ether'))
    ps += " SB1 " + str(Web3.fromWei(gCtx.rpc[1].eth.getBalance(boba_addrs['Proxy__L1StandardBridge']),'ether'))
    ps += " oETH " + str(Web3.fromWei(gCtx.contracts['oETH'].functions.totalSupply().call(),'ether'))
    ps += " FV+ " + str(Web3.fromWei(gCtx.rpc[2].eth.getBalance('0x4200000000000000000000000000000000000011') - fvStart,'ether'))
    lPrint(gCtx.log, ps)

    if env['ng_enabled']:
      ps = "NG Pool balances"
      ps += " Portal " + str(Web3.fromWei(gCtx.rpc[1].eth.getBalance(boba_addrs['L1_BobaPortal']),'ether'))
      ps += " L1EP " + str(Web3.fromWei(gCtx.contracts['L1_EthPool'].functions.availL1Balance().call(),'ether'))
      ps += ":" + str(Web3.fromWei(gCtx.contracts['L1_EthPool'].functions.safeL2Balance().call(),'ether'))
      ps += " L2EP " + str(Web3.fromWei(gCtx.contracts['L2_EthPool'].functions.safeL1Balance().call(),'ether'))
      ps += ":" + str(Web3.fromWei(gCtx.contracts['L2_EthPool'].functions.availL2Balance().call(),'ether'))
      lPrint(gCtx.log, ps)

    s = ""  
    now = time.time()
    slowTx = set()
    tMax = 0
    slowCount = 0

    for i in txWatch:
      c = txWatch[i]
      if len(c.ts) == 0:
        continue # FIXME - shouldn't happen
      t = now - c.ts[0]
      tMax = max(t,tMax)
      if t > slow_secs:
        slowCount += 1
        if slowCount <= 5:
          s += "(child " + str(c.num)+ " op " + c.op +" tx " + str(int(t)) + "s) "
        slowTx.add(c.num)

    for i in evWatch:
      c = evWatch[i]
      if len(c.ts) == 0:
        continue # FIXME - shouldn't happen
      t = now - c.ts[0]
      tMax = max(t,tMax)
      if t > slow_secs and c.num not in slowTx:
        slowCount += 1
        if slowCount <= 5:
          s += "(child " + str(c.num) + " op " + c.op +" ev " + str(int(t)) + "s) "

    os = "Other stats"
    os += " L1GP " + str(Web3.fromWei(gCtx.rpc[1].eth.gasPrice,'gwei'))
    os += " L2GP " + str(Web3.fromWei(gCtx.rpc[2].eth.gasPrice,'gwei'))
    os += " txWatch " + str(len(txWatch)) + " evWatch " + str(len(evWatch)) + " readyQueue " + str(readyQueue.qsize())
    os += " idleQueue " + str(idleQueue.qsize())
    os += " maxWait " + str(int(tMax)) + " SL " + str(shutdown.level)
    os += " (" + str(shutdown.num_done) + "/" + str(num_children) + ")"
    lPrint(gCtx.log, os)

    if slowCount > 5:
      s += "...and " + str(slowCount - 5) + " more"

    if s != "":
      lPrint(gCtx.log, "SLOW OPERATION WARNINGS: " + s)

    if tMax > stuck_secs and shutdown.level == 0:
      lPrint(gCtx.log, "Shutting down on STUCK_OPERATION timeout")
      shutdown.level = 1
    elif tMax > giveup_secs and shutdown.level == 1:
      lPrint(gCtx.log, "Forcing level 2 shutdown after " + str(giveup_secs) + " secs")
      shutdown.level = 2

    listLock.release()
    try:
      sys.stdout.flush()
      gCtx.log.flush()
    except:
      pass

    if shutdown.level == 1 and shutdown.num_done >= num_children:
      lPrint(gCtx.log, "Continuing shutdown")
      shutdown.level = 2
      break

    time.sleep(30)

lPrint(gCtx.log,"Main joining worker threads")
for t in threads:
  t.join()

lPrint(gCtx.log, "Main joining watcher threads")
l1_watcher.join()
l2_watcher.join()
idle_mgr.join()
ifThread.join()

balEnd = [None]*3
balEnd[1] = gCtx.rpc[1].eth.getBalance(funder.address)
balEnd[2] = gCtx.rpc[2].eth.getBalance(funder.address)

l1_net = Web3.fromWei(balEnd[1],'ether') - Web3.fromWei(balStart[1],'ether')
l2_net = Web3.fromWei(balEnd[2],'ether') - Web3.fromWei(balStart[2],'ether')

lPrint(gCtx.log, "Final balances: L1 = " + str(Web3.fromWei(balEnd[1],'ether')) + " (" + str(l1_net) + ") L2 = " + str(Web3.fromWei(balEnd[2],'ether')) + " (" + str(l2_net) + ")")
diff = l1_net + l2_net
if diff > 0:
  lPrint(gCtx.log, "Somehow we gained " + str(diff) + " ETH during this run")
else:
  lPrint(gCtx.log, "Total cost of run: " + str(-diff) + " ETH")

fvEnd = gCtx.rpc[2].eth.getBalance('0x4200000000000000000000000000000000000011')

lPrint(gCtx.log,"L2 Fee Vault collected " + str(Web3.fromWei(fvEnd-fvStart,'ether')) + " ETH during run")

s = "Batch submitter consumed " + str(shutdown.batchGas) + " L1 gas, costing " + str(Web3.fromWei(shutdown.batchGas * gasPrice[1], 'ether')) + " ETH"
l1AltPrice = 50
s += " (would be " + str(Web3.fromWei(shutdown.batchGas * Web3.toWei(l1AltPrice,'gwei'), 'ether')) + " @ L1 price of " + str(l1AltPrice) + " gwei)"
lPrint(gCtx.log,s)

s = "+++ OPS_TOTAL +++ Completed " + str(shutdown.total_ops) + " ops in " + str(runtime) + " seconds (" + str(int(3600 * shutdown.total_ops / runtime)) + "/hour)"
lPrint(gCtx.log, s)

lPrint(gCtx.log, "Main cleaning up")
if len(evWatch) == 0 and len(txWatch) == 0 and shutdown.num_done == num_children:
  op_log.write("# Clean exit at " + time.asctime(time.gmtime()) +"\n")
else:  
  op_log.write("# Dirty shutdown at " + time.asctime(time.gmtime()) +"\n")

op_log.close()
account_log.close()
