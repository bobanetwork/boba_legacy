# AWS Lambda Stableswap Toy Code

# AWS Lambda Test Input
# {
#   "body": "{\"L_x\":\"10.0\",\"L_y\":\"10.0\",\"A\":\"1.00\",\"x_in\":\"5.0\", \"sol\":\"true\"}"
# }

import json
import math
import textwrap
import struct

x = int(0)
y = int(0)
x_prev = int(0)
y_prev = int(0)
k = int(0)
A = int(0)
sol = bool(False)

def initializeLiquidity(_x,_y):
  global x, y, k, A, x_prev, y_prev
  assert (_x > 0 and _y > 0)
  y = _y
  x = _x
  x_prev = x
  y_prev = y
  k = x*y
  A = 1.0
  
def addLiquidity(x_in, y_in):
  global x, y, k, x_prev, y_prev
  assert (x_in > 0 and y_in > 0)
  x_prev = x
  y_prev = y
  x = x + x_in
  y = y + y_in
  k = x*y

def removeLiquidity(percOut):
  global x, y, k, x_prev, y_prev
  x_back = x*(percOut)/100
  y_back = y*(percOut)/100
  x_prev = x
  y_prev = y
  x = x - x_back
  y = y - y_back
  k = x*y

def changeA(_A):
  global A
  assert (_A >= 0)
  A = _A
  print("A changed to: " + str(A) + "\n")

def sqrt_B(a):
  assert (a >= 0)
  return math.sqrt(a)

def pow_B(base, exponent):
    print("POW: Precison mode\n")
    return pow(base, exponent)

def invariant():
  global x, y, k, A
  assert (x > 0 and x <= k)
  assert (y > 0 and y <= k)
  rootK = sqrt_B(k)
  LHS = 4*A*(x + y) + 2*rootK
  print("LHS: " + str(LHS) + "\n")
  RHS = 4*A*2*rootK + pow_B(2*rootK,3) / (4*x*y)
  print("RHS: " + str(RHS) + "\n")

  return abs(LHS - RHS) < 50

def swap_x(x_in):
  
  global x, y, k, A, x_prev, y_prev
  newX = x + x_in
  print("newX: " + str(newX) + "\n")
  print("A: " + str(A) + "\n")
  
  a = 4*A
  print("a: " + str(a) + "\n")
  
  K = 2*sqrt_B(k)
  print("K: " + str(K))

  alpha = 4*a*newX
  print("alpha: " + str(alpha) + "\n")
  
  beta = 4*a*pow_B(newX,2) + 4*newX*K - 4*a*K*newX
  print("beta: " + str(beta) + "\n")
  
  gamma = -pow_B(K,3)
  print("gamma: " + str(gamma) + "\n")

  # Solve quadratic
  d = pow_B(beta,2) - 4*alpha*gamma
  sqrtD = sqrt_B(abs(d))

  if(d >= 0):
    root1 = (-beta + sqrtD) / (2*alpha)
    root2 = (-beta - sqrtD) / (2*alpha)
    newY = root1 if (root1 > 0 and root1 <= k) else root2
    x_prev = x
    y_prev = y
    x = newX
    y = newY
    assert invariant()
  else:
    raise ("Error: not invariant")

def swap_y(y_in):
  global x, y, k, A, x_prev, y_prev
  newY = y + y_in
  a = 4*A
  K = 2*sqrt_B(k)
  print("K: " + str(K))

  alpha = 4*a*newY
  print("alpha: " + str(alpha) + "\n")
  beta = 4*a*pow_B(newY,2) + 4*newY*K - 4*a*K*newY
  print("beta: " + str(beta) + "\n")
  gamma = -pow_B(K,3)
  print("gamma: " + str(gamma) + "\n")

  # Solve quadratic
  d = pow_B(beta,2) - 4*alpha*gamma
  sqrtD = sqrt_B(abs(d))

  if(d >= 0):
    root1 = (-beta + sqrtD) / (2*alpha)
    root2 = (-beta - sqrtD) / (2*alpha)
    newX = root1 if (root1 > 0 and root1 <= k) else root2
    x_prev = x
    y_prev = y
    x = newX
    y = newY
    assert invariant()
  else:
    raise ("Error: not invariant")
    
def lambda_handler(event, context):

    global x, y, A, y_prev
    input = json.loads(event["body"])
    
    print("DEBUG: from Geth:", input)
    print("DEBUG: from Geth:", input['params'][0])
    
    param4HexString = input['params'][0]
    param4HexString = param4HexString.removeprefix("0x")

    #break the string into length 64 chunks
    params = textwrap.wrap(param4HexString, 64)

    L_x  = float(int(params[1], 16))
    L_y  = float(int(params[2], 16))
    a    = float(int(params[3], 16))
    x_in = float(int(params[4], 16))

    print('DEBUG: Inputs:'
      ' L_x:', L_x, 
      ' L_y:', L_y, 
      ' A:', a,
      ' x_in:', x_in)
    
    # Do the math
    initializeLiquidity(L_x, L_y)
    changeA(a)
    swap_x(x_in)
    
    res = '0x{0:0{1}x}'.format(int(32),64)
    result = res + '{0:0{1}x}'.format(int(y),64) #the actual result
    
    print("RESULT:", result)

    returnPayload = {
      'statusCode': 200,
      'body': json.dumps({
        "result": result
      })
    }

    print('return payload:', returnPayload)
    
    return returnPayload