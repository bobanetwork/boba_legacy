# AWS Lambda Stableswap Toy Code

# AWS Lambda Test Input
# {
#   "body": "{\"L_x\":\"10.0\",\"L_y\":\"10.0\",\"A\":\"1.00\",\"x_in\":\"5.0\", \"sol\":\"true\"}"
# }

import json
import math

x = int(0)
y = int(0)
x_prev = int(0)
y_prev = int(0)
k = int(0)
A = int(0)
sol = bool(False)

def initializeLiquidity(_x,_y,_sol):
  global x, y, k, A, x_prev, y_prev, sol
  assert (_x > 0 and _y > 0)
  sol = _sol
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
  global sol
  assert (a >= 0)
  
  print("Solidity mode: " + str(sol) + "\n")
  
  # solidity
  if sol:
    print("SQRT: Solidity mode\n")
    if (a == 0):
      return 0
    elif (a <= 3):
      print("Solidity SQRT error: " + str(math.sqrt(a)-1.0) + "\n")
      return 1
    c = (a+1)//2
    b = a
    while(c < b):
      b = c
      c = ((a//c) + c)//2
    print("Solidity SQRT error: " + str(math.sqrt(a)-int(b)) + "\n")
    return int(b)
  else:
    print("SQRT: Precison mode\n")
    return math.sqrt(a)

def pow_B(base, exponent):
    global sol

    if sol:
      print("POW: Solidity mode\n")
      if(exponent == 0):
        return 1
      elif (exponent == 1):
        return base
      elif (base == 0 and not(exponent == 0)):
        return 0
      else:
        z = base
        for i in range(1, exponent):
          z = z*base
        return z
    else:
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

    global x, y, k, A, x_prev, y_prev, sol
    input = json.loads(event["body"])
    
    print("DEBUG: Inputs:", input)

    # Prepare the inputs
    L_x = float(input["L_x"])
    L_y = float(input["L_y"])
    a = float(input["A"])
    x_in = float(input["x_in"])
    sol = bool(input["sol"] == 'true')

    if sol:
      print("Emulating solidity\n")
    else: 
      print("Precison mode\n")

    print('DEBUG: Inputs: L_x:', L_x, 
      ' L_y:', L_y, 
      ' A:', a,
      ' x_in:', x_in,
      ' sol:', sol)
    
    # Do the math
    initializeLiquidity(L_x, L_y, sol)
    changeA(a)
    swap_x(x_in)

    return {
        'statusCode': 200,
        'body': json.dumps({"x_in":x_in, "y_out":y_prev-y,"x_new":x,"y_prev":y_prev, "y_new":y, "sol": sol})
    }