import json
import textwrap
from qiskit import QuantumRegister, ClassicalRegister, QuantumCircuit, execute, IBMQ

api_key = 'YOUR_API_KEY'

authorized_contract = None  # for open access


# or...
# authorized_contract = '0xOF_YOUR_HELPER_CONTRACT' # to restrict access to only your smart contract

def lambda_handler(event, context):
  print("EVENT: ", event)
  if event is None:
    return {"error": "no event payload"}

  input = json.loads(event["body"])
  print("DEBUG: from Geth:", input)

  if authorized_contract is not None:
    # check authorisation if desired
    callerAddress = input['method']
    if callerAddress.lower() != authorized_contract.lower():
      returnPayload = {'statusCode': 403}
      print('return payload:', returnPayload)
      return returnPayload

      # get calling parameters
  paramsHexString = input['params'][0]
  paramsHexString = paramsHexString.removeprefix("0x")
  params = textwrap.wrap(paramsHexString, 64)

  # 3 parameter example:
  # ['0000000000000000000000000000000000000000000000000000000000000120', '0000000000000000000000000000000000000000000000000000000000000060',
  # '00000000000000000000000000000000000000000000000000000000000000a0', '00000000000000000000000000000000000000000000000000000000000000e0',
  # '0000000000000000000000000000000000000000000000000000000000000006', '737472696e670000000000000000000000000000000000000000000000000000',
  # '0000000000000000000000000000000000000000000000000000000000000008', '67656e7265733a30000000000000000000000000000000000000000000000000',
  # '000000000000000000000000000000000000000000000000000000000000001d', '6172746973742f3158796f347538755843315a6d4d706174463035504a000000']

  # 2 parameter example:
  # ['00000000000000000000000000000000000000000000000000000000000000c0', '0000000000000000000000000000000000000000000000000000000000000040',
  # '0000000000000000000000000000000000000000000000000000000000000080', '0000000000000000000000000000000000000000000000000000000000000008',
  # '67656e7265733a30000000000000000000000000000000000000000000000000', '000000000000000000000000000000000000000000000000000000000000001d',
  # '6172746973742f3158796f347538755843315a6d4d706174463035504a000000']

  # 1 parameter example:
  # 0000000000000000000000000000000000000000000000000000000000000060
  # 0000000000000000000000000000000000000000000000000000000000000020
  # 000000000000000000000000000000000000000000000000000000000000000c
  # 476574466f6c6c6f776572730000000000000000000000000000000000000000

  str_length = int(params[2], 16) * 2

  request = params[3]
  bytes_object = bytes.fromhex(request[0:str_length])
  quantum_engine = bytes_object.decode("ASCII")

  IBMQ.enable_account(api_key)

  provider = IBMQ.get_provider(hub='ibm-q')

  q = QuantumRegister(16, 'q')
  c = ClassicalRegister(16, 'c')
  circuit = QuantumCircuit(q, c)
  circuit.h(q)  # Applies hadamard gate to all qubits
  circuit.measure(q, c)  # Measures all qubits

  backend = provider.get_backend(quantum_engine)  # e.g. ibmq_qasm_simulator
  job = execute(circuit, backend, shots=1)

  print('Executing Job...\n')
  result = job.result()
  counts = result.get_counts(circuit)
  random_number = int(list(counts.keys())[0], 2)  # parse to decimal

  # create return payload
  res = '0x' + '{0:0{1}x}'.format(int(32), 64)
  # 64 denotes the number of bytes in the `bytes` dynamic argument
  # since we are sending back 2 32 byte numbers, 2*32 = 64
  res = res + '{0:0{1}x}'.format(int(random_number), 64)

  print("res:", res)

  # example res:
  # 0x
  # 0000000000000000000000000000000000000000000000000000000000000040
  # 0000000000000000000000000000000000000000000000000000000000418b95
  # 0000000000000000000000000000000000000000000000000000017e60d3b45f

  returnPayload = {
    'statusCode': 200,
    'body': json.dumps({
      "result": res
    })
  }

  print('return payload:', returnPayload)

  return returnPayload
