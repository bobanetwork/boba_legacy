# AWS Lambda Stableswap Toy Code
import json

x = int(0)
y = int(0)
k = int(0)
A = int(0)

def initializeLiquidity(_x,_y):
  global x, y, k, A
  x = _x
  y = _y
  k = x*y
  A = 0

def addLiquidity(x_in, y_in):
  global x, y, k, A
  assert (x_in > 0 and y_in > 0)
  x = x + x_in
  y = y + y_in
  k = x*y

def removeLiquidity(percOut):
  global x, y, k, A
  x_back = x*(percOut)//100
  y_back = y*(percOut)//100
  x = x - x_back
  y = y - y_back
  k = x*y

def changeA(_A):
  global x, y, k, A
  assert (_A >= 0)
  A = _A

def sqrt(a):
  assert (a >= 0)
  if (a == 0): return 0
  elif (a <= 3): return 1

  c = (a+1)//2
  b = a
  while(c < b):
    b = c
    c = ((a//c) + c)//2

  return int(b)

def pow(base, exponent):
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

def invariant():
  global x, y, k, A
  assert (x > 0 and x <= k)
  assert (y > 0 and y <= k)
  rootK = sqrt(k)
  LHS = (4*A*(x + y)) + (2*rootK)
  print("LHS: " + str(LHS) + "\n")
  RHS = (4*A*(2*rootK)) + (pow((2*rootK),3)//(4*x*y))
  print("RHS: " + str(RHS) + "\n")

  return (abs(LHS - RHS) < 50)

def swap_x(x_in):
  global x, y, k, A
  newX = x + x_in
  a = 4*A
  K = 2*(sqrt(k))
  # print("K: " + str(K))

  alpha = 4*a*newX
  # print("alpha: " + str(alpha) + "\n")
  beta = (4*a*pow(newX,2)) + (4*newX*K) - (4*a*K*newX)
  # print("beta: " + str(beta) + "\n")
  gamma = -(pow(K,3))
  # print("gamma: " + str(gamma) + "\n")

  # Solve quadratic
  d = pow(beta,2) - (4*alpha*gamma)
  sqrtD = sqrt(abs(d))

  if(d >= 0):
    root1 = ((-beta) + sqrtD)//(2*alpha)
    root2 = ((-beta) - sqrtD)//(2*alpha)
    newY = root1 if (root1 > 0 and root1 <= k) else root2

    x = newX
    y = newY
    # assert (invariant())
  else:
    raise ("Error!")


def swap_y(y_in):
  global x, y, k, A
  newY = y + y_in
  a = 4*A
  K = 2*(sqrt(k))

  alpha = 4*a*newY
  beta = (4*a*pow(newY,2)) + (4*newY*K) - (4*a*K*newY)
  gamma = -(pow(K,3))

  # Solve quadratic
  d = pow(beta,2) - (4*alpha*gamma)
  sqrtD = sqrt(abs(d))

  if(d >= 0):
    root1 = ((-beta) + sqrtD)//(2*alpha)
    root2 = ((-beta) - sqrtD)//(2*alpha)
    newX = root1 if (root1 > 0 and root1 <= k) else root2

    x = newX
    y = newY
    # assert (invariant())
  else:
    raise ("Error!")
    
def lambda_handler(event, context):

    input = json.loads(event["body"])
    
    # Prepare the inputs
    x_in = float(input["x_in"])
    L_x = float(input["L_x"])
    L_y = float(input["L_y"])
    a = float(input["A"])
    
    print("DEBUG: Inputs - x_in:",x_in, ' L_x:', L_x, ' L_y:', L_y, ' A:', a)
    
    # Do the math
    initializeLiquidity(L_x,L_y)
    
    changeA(a)
    
    swap_x(x_in)
    
    return {
        'statusCode': 200,
        'body': json.dumps({"x_in":x_in,"x":x,"y":y,"A":A})
    }
