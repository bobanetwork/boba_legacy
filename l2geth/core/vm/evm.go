// Copyright 2014 The go-ethereum Authors
// This file is part of the go-ethereum library.
//
// The go-ethereum library is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// The go-ethereum library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with the go-ethereum library. If not, see <http://www.gnu.org/licenses/>.

package vm

import (
	"bytes"
	"crypto/rand"
	"fmt"
	"math/big"
	"sync/atomic"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/log"
	"github.com/ethereum/go-ethereum/params"
	"github.com/ethereum/go-ethereum/rollup/dump"
	"github.com/ethereum/go-ethereum/rollup/rcfg"
	"github.com/ethereum/go-ethereum/rollup/util"
	"github.com/ethereum/go-ethereum/rpc"
	"golang.org/x/crypto/sha3"
)

// emptyCodeHash is used by create to ensure deployment is disallowed to already
// deployed contract addresses (relevant after the account abstraction).
var emptyCodeHash = crypto.Keccak256Hash(nil)

type (
	// CanTransferFunc is the signature of a transfer guard function
	CanTransferFunc func(StateDB, common.Address, *big.Int) bool
	// TransferFunc is the signature of a transfer function
	TransferFunc func(StateDB, common.Address, common.Address, *big.Int)
	// GetHashFunc returns the n'th block hash in the blockchain
	// and is used by the BLOCKHASH EVM op code.
	GetHashFunc func(uint64) common.Hash
)

// run runs the given contract and takes care of running precompiles with a fallback to the byte code interpreter.
func run(evm *EVM, contract *Contract, input []byte, readOnly bool) ([]byte, error) {
	if contract.CodeAddr != nil {
		precompiles := PrecompiledContractsHomestead
		if evm.chainRules.IsByzantium {
			precompiles = PrecompiledContractsByzantium
		}
		if evm.chainRules.IsIstanbul {
			precompiles = PrecompiledContractsIstanbul
		}
		if p := precompiles[*contract.CodeAddr]; p != nil {
			return RunPrecompiledContract(p, input, contract)
		}
	}
	for _, interpreter := range evm.interpreters {
		if interpreter.CanRun(contract.Code) {
			if evm.interpreter != interpreter {
				// Ensure that the interpreter pointer is set back
				// to its current value upon return.
				defer func(i Interpreter) {
					evm.interpreter = i
				}(evm.interpreter)
				evm.interpreter = interpreter
			}
			return interpreter.Run(contract, input, readOnly)
		}
	}
	return nil, ErrNoCompatibleInterpreter
}

// Context provides the EVM with auxiliary information. Once provided
// it shouldn't be modified.
type Context struct {
	// CanTransfer returns whether the account contains
	// sufficient ether to transfer the value
	CanTransfer CanTransferFunc
	// Transfer transfers ether from one account to the other
	Transfer TransferFunc
	// GetHash returns the hash corresponding to n
	GetHash GetHashFunc

	// Message information
	Origin   common.Address // Provides information for ORIGIN
	GasPrice *big.Int       // Provides information for GASPRICE

	// Block information
	Coinbase    common.Address // Provides information for COINBASE
	GasLimit    uint64         // Provides information for GASLIMIT
	BlockNumber *big.Int       // Provides information for NUMBER
	Time        *big.Int       // Provides information for TIME
	Difficulty  *big.Int       // Provides information for DIFFICULTY

	// OVM information
	L1BlockNumber *big.Int // Provides information for L1BLOCKNUMBER

	// Turing information
	Turing      []byte
	TuringDepth int
	Sequencer   bool
}

// EVM is the Ethereum Virtual Machine base object and provides
// the necessary tools to run a contract on the given state with
// the provided context. It should be noted that any error
// generated through any of the calls should be considered a
// revert-state-and-consume-all-gas operation, no checks on
// specific errors should ever be performed. The interpreter makes
// sure that any errors generated are to be considered faulty code.
//
// The EVM should never be reused and is not thread safe.
type EVM struct {
	// Context provides auxiliary blockchain related information
	Context
	// StateDB gives access to the underlying state
	StateDB StateDB
	// Depth is the current call stack
	depth int

	// chainConfig contains information about the current chain
	chainConfig *params.ChainConfig
	// chain rules contains the chain rules for the current epoch
	chainRules params.Rules
	// virtual machine configuration options used to initialise the
	// evm.
	vmConfig Config
	// global (to this context) ethereum virtual machine
	// used throughout the execution of the tx.
	interpreters []Interpreter
	interpreter  Interpreter
	// abort is used to abort the EVM calling operations
	// NOTE: must be set atomically
	abort int32
	// callGasTemp holds the gas available for the current call. This is needed because the
	// available gas is calculated in gasCall* according to the 63/64 rule and later
	// applied in opCall*.
	callGasTemp uint64
}

// NewEVM returns a new EVM. The returned EVM is not thread safe and should
// only ever be used *once*.
func NewEVM(ctx Context, statedb StateDB, chainConfig *params.ChainConfig, vmConfig Config) *EVM {
	evm := &EVM{
		Context:      ctx,
		StateDB:      statedb,
		vmConfig:     vmConfig,
		chainConfig:  chainConfig,
		chainRules:   chainConfig.Rules(ctx.BlockNumber),
		interpreters: make([]Interpreter, 0, 1),
	}

	if chainConfig.IsEWASM(ctx.BlockNumber) {
		// to be implemented by EVM-C and Wagon PRs.
		// if vmConfig.EWASMInterpreter != "" {
		//  extIntOpts := strings.Split(vmConfig.EWASMInterpreter, ":")
		//  path := extIntOpts[0]
		//  options := []string{}
		//  if len(extIntOpts) > 1 {
		//    options = extIntOpts[1..]
		//  }
		//  evm.interpreters = append(evm.interpreters, NewEVMVCInterpreter(evm, vmConfig, options))
		// } else {
		// 	evm.interpreters = append(evm.interpreters, NewEWASMInterpreter(evm, vmConfig))
		// }
		panic("No supported ewasm interpreter yet.")
	}

	// vmConfig.EVMInterpreter will be used by EVM-C, it won't be checked here
	// as we always want to have the built-in EVM as the failover option.
	evm.interpreters = append(evm.interpreters, NewEVMInterpreter(evm, vmConfig))
	evm.interpreter = evm.interpreters[0]

	return evm
}

// Cancel cancels any running EVM operation. This may be called concurrently and
// it's safe to be called multiple times.
func (evm *EVM) Cancel() {
	atomic.StoreInt32(&evm.abort, 1)
}

// Cancelled returns true if Cancel has been called
func (evm *EVM) Cancelled() bool {
	return atomic.LoadInt32(&evm.abort) == 1
}

// Interpreter returns the current interpreter
func (evm *EVM) Interpreter() Interpreter {
	return evm.interpreter
}

// In response to an off-chain Turing request, obtain the requested data and
// rewrite the parameters so that the contract can be called without reverting.
func bobaTuringRandom(input []byte, caller common.Address) hexutil.Bytes {

	var ret hexutil.Bytes

	rest := input[4:]

	//some things are easier with a hex string
	inputHexUtil := hexutil.Bytes(input)

	/* The input and calldata have a well defined structure
	1/ The methodID (4 bytes)
	2/ The rType (32 bytes)
	3/ The return placeholder uint256
	*/

	// If things fail, we'll return an integer parameter which will fail a
	// "require" in the contract.
	retError := make([]byte, len(inputHexUtil))
	copy(retError, inputHexUtil)

	// Check the rType
	// 1 for Request, 2 for Response, integer >= 10 for various failures
	rType := int(rest[31])
	if rType != 1 {
		log.Error("TURING bobaTuringRandom:Wrong state (rType != 1)", "rType", rType)
		retError[35] = 10 // Wrong input state
		return retError
	}

	rlen := len(rest)
	if rlen < 2*32 {
		log.Error("TURING bobaTuringRandom:Calldata too short", "len < 2*32", rlen)
		retError[35] = 11 // Calldata too short
		return retError
	}

	// Generate cryptographically strong pseudo-random int between 0 - 2^256 - 1
	one := big.NewInt(1)
	two := big.NewInt(2)
	max := new(big.Int)
	// Max random value 2^256 - 1
	max = max.Exp(two, big.NewInt(int64(256)), nil).Sub(max, one)
	n, err := rand.Int(rand.Reader, max)

	if err != nil {
		log.Error("TURING bobaTuringRandom:Random Number Generation Failed", "err", err)
		retError[35] = 16 // RNG Failure
		return retError
	}

	//generate a BigInt random number
	randomBigInt := n

	log.Debug("TURING bobaTuringRandom:Random number",
		"randomBigInt", randomBigInt)

	// build the calldata
	methodID := make([]byte, 4)
	copy(methodID, inputHexUtil[0:4])
	ret = append(methodID, hexutil.MustDecode(fmt.Sprintf("0x%064x", 2))...) // the usual prefix and the rType, now changed to 2
	ret = append(ret, hexutil.MustDecode(fmt.Sprintf("0x%064x", randomBigInt))...)

	log.Debug("TURING bobaTuringRandom:Modified parameters",
		"newValue", ret)

	return ret
}

// In response to an off-chain Turing request, obtain the requested data and
// rewrite the parameters so that the contract can be called without reverting.
// caller is the address of the TuringHelper contract
func bobaTuringCall(input []byte, caller common.Address) hexutil.Bytes {

	log.Debug("TURING bobaTuringCall:Caller", "caller", caller.String())

	var responseStringEnc string
	var responseString []byte

	rest := input[4:]

	//some things are easier with a hex string
	inputHexUtil := hexutil.Bytes(input)
	restHexUtil := inputHexUtil[4:]

	/* The input and calldata have a well defined structure
	1/ The methodID (4 bytes)
	2/ The rType (32 bytes)
	3/ Data offset 1 - beginning of URL string (32 bytes)
	4/ Data offset 2 - beginning of payload (32 bytes)
	5/ URL string length (32 bytes)
	6/ URL string - either 32 or 64 bytes
	7/ Payload length (32 bytes)
	8/ Payload data - variable but at least 32 bytes
	This means that the calldata are always >= 7*32

	If things fail, we'll return an integer parameter which will fail a
	"require" in the turing helper contract.
	*/

	retError := make([]byte, len(inputHexUtil))
	copy(retError, inputHexUtil)

	// Check the rType
	// 1 for Request, 2 for Response, integer >= 10 for various failures
	rType := int(rest[31])
	if rType != 1 {
		log.Error("TURING bobaTuringCall:Wrong state (rType != 1)", "rType", rType)
		retError[35] = 10 // Wrong input state
		return retError
	}

	rlen := len(rest)
	if rlen < 7*32 {
		log.Error("TURING bobaTuringCall:Calldata too short", "len < 7*32", rlen)
		retError[35] = 11 // Calldata too short
		return retError
	}

	// A micro-ABI decoder... this works because we know that all these numbers can never exceed 256
	// Since the rType is 32 bytes and the three headers are 32 bytes each, the max possible value
	// of any of these numbers is 32 + 32 + 32 + 32 + 64 = 192
	// Thus, we only need to read one byte

	// 0  -  31 = rType
	// 32  -  63 = URL start
	// 64  -  95 = payload start
	// 96  - 127 = length URL string
	// 128 - ??? = URL string
	// ??? - ??? = payload length
	// ??? - end = payload

	startIDXurl := int(rest[63]) + 32
	// the +32 means that we are going directly for the actual string
	// bytes 0 to 31 are the string length

	startIDXpayload := int(rest[95]) // the start of the payload
	lengthURL := int(rest[127])      // the length of the URL string

	// Check the URL length
	// Note: we do not handle URLs that are longer than 64 characters
	if lengthURL > 64 {
		log.Error("TURING bobaTuringCall:URL > 64", "urlLength", lengthURL)
		retError[35] = 12 // URL string > 64 bytes
		return retError
	}

	// The URL we are going to query
	endIDX := startIDXurl + lengthURL
	url := string(rest[startIDXurl:endIDX])
	// we use a specific end value (startIDXurl+lengthURL) since the URL is right-packed with zeros

	// At this point, we have the API endpoint and the payload that needs to go there...
	payload := restHexUtil[startIDXpayload:] //using hex here since that makes it easy to get the string

	log.Debug("TURING bobaTuringCall:Have URL and payload",
		"url", url,
		"payload", payload)

	client, err := rpc.Dial(url)

	if client != nil {
		startT := time.Now()
		log.Debug("TURING bobaTuringCall:Calling off-chain client at", "url", url)
		err := client.CallTimeout(&responseStringEnc, caller.String(), time.Duration(1200)*time.Millisecond, payload)
		if err != nil {
			log.Error("TURING bobaTuringCall:Client error", "err", err)
			retError[35] = 13 // Client Error
			return retError
		}
		if len(responseStringEnc) > 322 {
			log.Error("TURING bobaTuringCall:Raw response too long (> 322)", "length", len(responseStringEnc), "responseStringEnc", responseStringEnc)
			retError[35] = 17 // Raw Response too long
			return retError
		}
		responseString, err = hexutil.Decode(responseStringEnc)
		if err != nil {
			log.Error("TURING bobaTuringCall:Error decoding responseString", "err", err)
			retError[35] = 14 // Client Response Decode Error
			return retError
		}
		// if we get back, for example,
		// 0x
		// 0000000000000000000000000000000000000000000000000000000000000040
		// 0000000000000000000000000000000000000000000000000000000000418b95
		// 0000000000000000000000000000000000000000000000000000017e60d3b45f
		// this leads to len(responseString) of 3*32 = 96
		// let's cap the byte payload at 32 + 4*32 = 160 - this allows encoding of 4 uint256
		// Security perspective - we locally construct the revised calldata, EXCEPT the last field
		// the `bytes memory _payload`, which is limited to 160 bytes max
		// Garbage-in scenario: Assuming the payload is filled with garbage, this will break downstream
		// abi.decode(encResponse,(uint256))'s for example, but that's a problem at the contract level not at the Geth level
		// DDOS scenario: Assuming the payload is filled with lots of garbage, this will burn ETH
		// reflecting the cost of storing junk on L1.
		// Evil-in scenario: Assume a long / specially crafted payload is returned from the external API
		// In this attack, the idea would be to break client.Call as it is trying to pack the response into &responseStringEnc
		// Alternatively, could attack hexutil.Decode
		if len(responseString) > 160 {
			log.Error("TURING bobaTuringCall:Response too big (> 160 bytes)", "length", len(responseString), "responseString", responseString)
			retError[35] = 18 // Response too big
			return retError
		}
		t := time.Now()
		elapsed := t.Sub(startT)
		log.Debug("TURING API response time", "elapsed", elapsed)
	} else {
		log.Error("TURING bobaTuringCall:Failed to create client for off-chain request", "err", err)
		retError[35] = 15 // Could not create client
		return retError
	}

	log.Debug("TURING bobaTuringCall:Have valid response from offchain API",
		"Target", url,
		"Payload", payload,
		"ResponseStringEnc", responseStringEnc,
		"ResponseString", responseString)

	// build the modified calldata
	ret := make([]byte, startIDXpayload+4)
	copy(ret, inputHexUtil[0:startIDXpayload+4]) // take the original input
	ret[35] = 2                                  // change byte 3 + 32 = 35 (rType) to indicate a valid response
	ret = append(ret, responseString...)         // and tack on the payload

	log.Debug("TURING bobaTuringCall:Modified parameters",
		"newValue", hexutil.Bytes(ret))

	return ret
}

// Call executes the contract associated with the addr with the given input as
// parameters. It also handles any necessary value transfer required and takes
// the necessary steps to create accounts and reverses the state in case of an
// execution error or failed value transfer.
func (evm *EVM) Call(caller ContractRef, addr common.Address, input []byte, gas uint64, value *big.Int) (ret []byte, leftOverGas uint64, err error) {
	if evm.vmConfig.NoRecursion && evm.depth > 0 {
		return nil, gas, nil
	}

	// Fail if we're trying to execute above the call depth limit
	if evm.depth > int(params.CallCreateDepth) {
		return nil, gas, ErrDepth
	}
	// Fail if we're trying to transfer more than the available balance
	if !evm.Context.CanTransfer(evm.StateDB, caller.Address(), value) {
		return nil, gas, ErrInsufficientBalance
	}

	var (
		to       = AccountRef(addr)
		snapshot = evm.StateDB.Snapshot()
	)
	if !evm.StateDB.Exist(addr) {
		precompiles := PrecompiledContractsHomestead
		if evm.chainRules.IsByzantium {
			precompiles = PrecompiledContractsByzantium
		}
		if evm.chainRules.IsIstanbul {
			precompiles = PrecompiledContractsIstanbul
		}
		if precompiles[addr] == nil && evm.chainRules.IsEIP158 && value.Sign() == 0 {
			// Calling a non existing account, don't do anything, but ping the tracer
			if evm.vmConfig.Debug && evm.depth == 0 {
				evm.vmConfig.Tracer.CaptureStart(caller.Address(), addr, false, input, gas, value)
				evm.vmConfig.Tracer.CaptureEnd(ret, 0, 0, nil)
			}
			return nil, gas, nil
		}
		evm.StateDB.CreateAccount(addr)
	}
	evm.Transfer(evm.StateDB, caller.Address(), to.Address(), value)
	// Initialise a new contract and set the code that is to be used by the EVM.
	// The contract is a scoped environment for this execution context only.
	contract := NewContract(caller, to, value, gas)
	contract.SetCallCode(&addr, evm.StateDB.GetCodeHash(addr), evm.StateDB.GetCode(addr))

	// Even if the account has no code, we need to continue because it might be a precompile
	start := time.Now()

	// Capture the tracer start/end events in debug mode
	if evm.vmConfig.Debug && evm.depth == 0 {
		evm.vmConfig.Tracer.CaptureStart(caller.Address(), addr, false, input, gas, value)

		defer func() { // Lazy evaluation of the parameters
			evm.vmConfig.Tracer.CaptureEnd(ret, gas-contract.Gas, time.Since(start), err)
		}()
	}

	isTuring2 := false
	isGetRand2 := false

	// Geth test sometimes calls this with length zero input; this check is needed for tests to complete
	if len(input) > 0 {
		//methodID for GetResponse is 7d93616c -> [125 147 97 108]
		isTuring2 = bytes.Equal(input[:4], []byte{125, 147, 97, 108})

		//methodID for GetRandom is 493d57d6 -> [73 61 87 214]
		isGetRand2 = bytes.Equal(input[:4], []byte{73, 61, 87, 214})
	}

	// TuringCall takes the original calldata, figures out what needs
	// to be done, and then synthesizes a 'updated_input' calldata
	var updated_input hexutil.Bytes

	// Sanity and depth checks
	if isTuring2 || isGetRand2 {
		log.Debug("TURING REQUEST START", "input", input, "len(evm.Context.Turing)", len(evm.Context.Turing))
		// Check 1. can only run Turing once anywhere in the call stack
		if evm.Context.TuringDepth > 1 {
			log.Error("TURING ERROR: DEPTH > 1", "evm.Context.TuringDepth", evm.Context.TuringDepth)
			return nil, gas, ErrTuringDepth
		}
		// Check 2. if we are verifier/replica AND (isTuring2 || isGetRand2), then Turing must have run previously
		if !evm.Context.Sequencer && len(evm.Context.Turing) < 2 {
			log.Error("TURING ERROR: NO PAYLOAD", "evm.Context.Turing", evm.Context.Turing)
			return nil, gas, ErrTuringEmpty
		}
		if evm.StateDB.TuringCheck(caller.Address()) != nil {
			log.Error("TURING bobaTuringCall:Insufficient credit")
			return nil, gas, ErrInsufficientBalance
		}
		if evm.Context.Sequencer && len(evm.Context.Turing) < 2 {
			// This is the first run of Turing for this transaction
			// We sometimes use a short evm.Context.Turing payload for debug purposes, hence the < 2.
			// A real modified callData is always much much > 1 byte
			// This case _should_ never happen in Verifier/Replica mode, since the sequencer will already have run the Turing call
			if isTuring2 {
				updated_input = bobaTuringCall(input, caller.Address())
			} else if isGetRand2 {
				updated_input = bobaTuringRandom(input, caller.Address())
			} // there is no other option
			ret, err = run(evm, contract, updated_input, false)
			log.Debug("TURING NEW CALL", "updated_input", updated_input)
			// and now, provide the updated_input to the context so that the data can be sent to L1 and the CTC
			evm.Context.Turing = updated_input
			evm.Context.TuringDepth++
		} else {
			// We are in Verifier/Replica mode
			// Turing for this Transaction has already been run elsewhere - replay using
			// information from the EVM context
			ret, err = run(evm, contract, evm.Context.Turing, false)
			log.Debug("TURING REPLAY", "evm.Context.Turing", evm.Context.Turing)
		}
		if evm.StateDB.TuringCharge(caller.Address()) != nil {
			log.Error("TURING bobaTuringCall:Insufficient credit")
			return nil, gas, ErrInsufficientBalance
		}
		log.Debug("TURING REQUEST END", "updated_input", updated_input)
	} else {
		ret, err = run(evm, contract, input, false)
	}

	log.Debug("TURING evm.go run",
		"contract", contract.CodeAddr,
		"ret", hexutil.Bytes(ret),
		"err", err,
		"updated_input", updated_input,
		"evm.Context.Turing", evm.Context.Turing,
		"length Turing", len(evm.Context.Turing))

	// When an error was returned by the EVM or when setting the creation code
	// above we revert to the snapshot and consume any gas remaining. Additionally
	// when we're in homestead this also counts for code storage gas errors.
	if err != nil {
		evm.StateDB.RevertToSnapshot(snapshot)
		if err != errExecutionReverted {
			contract.UseGas(contract.Gas)
		}
	}
	return ret, contract.Gas, err
}

// CallCode executes the contract associated with the addr with the given input
// as parameters. It also handles any necessary value transfer required and takes
// the necessary steps to create accounts and reverses the state in case of an
// execution error or failed value transfer.
//
// CallCode differs from Call in the sense that it executes the given address'
// code with the caller as context.
func (evm *EVM) CallCode(caller ContractRef, addr common.Address, input []byte, gas uint64, value *big.Int) (ret []byte, leftOverGas uint64, err error) {
	if evm.vmConfig.NoRecursion && evm.depth > 0 {
		return nil, gas, nil
	}

	// Fail if we're trying to execute above the call depth limit
	if evm.depth > int(params.CallCreateDepth) {
		return nil, gas, ErrDepth
	}
	// Fail if we're trying to transfer more than the available balance
	if !evm.CanTransfer(evm.StateDB, caller.Address(), value) {
		return nil, gas, ErrInsufficientBalance
	}

	var (
		snapshot = evm.StateDB.Snapshot()
		to       = AccountRef(caller.Address())
	)
	// Initialise a new contract and set the code that is to be used by the EVM.
	// The contract is a scoped environment for this execution context only.
	contract := NewContract(caller, to, value, gas)
	contract.SetCallCode(&addr, evm.StateDB.GetCodeHash(addr), evm.StateDB.GetCode(addr))

	ret, err = run(evm, contract, input, false)
	if err != nil {
		evm.StateDB.RevertToSnapshot(snapshot)
		if err != errExecutionReverted {
			contract.UseGas(contract.Gas)
		}
	}
	return ret, contract.Gas, err
}

// DelegateCall executes the contract associated with the addr with the given input
// as parameters. It reverses the state in case of an execution error.
//
// DelegateCall differs from CallCode in the sense that it executes the given address'
// code with the caller as context and the caller is set to the caller of the caller.
func (evm *EVM) DelegateCall(caller ContractRef, addr common.Address, input []byte, gas uint64) (ret []byte, leftOverGas uint64, err error) {
	if evm.vmConfig.NoRecursion && evm.depth > 0 {
		return nil, gas, nil
	}
	// Fail if we're trying to execute above the call depth limit
	if evm.depth > int(params.CallCreateDepth) {
		return nil, gas, ErrDepth
	}

	var (
		snapshot = evm.StateDB.Snapshot()
		to       = AccountRef(caller.Address())
	)

	// Initialise a new contract and make initialise the delegate values
	contract := NewContract(caller, to, nil, gas).AsDelegate()
	contract.SetCallCode(&addr, evm.StateDB.GetCodeHash(addr), evm.StateDB.GetCode(addr))

	ret, err = run(evm, contract, input, false)
	if err != nil {
		evm.StateDB.RevertToSnapshot(snapshot)
		if err != errExecutionReverted {
			contract.UseGas(contract.Gas)
		}
	}
	return ret, contract.Gas, err
}

// StaticCall executes the contract associated with the addr with the given input
// as parameters while disallowing any modifications to the state during the call.
// Opcodes that attempt to perform such modifications will result in exceptions
// instead of performing the modifications.
func (evm *EVM) StaticCall(caller ContractRef, addr common.Address, input []byte, gas uint64) (ret []byte, leftOverGas uint64, err error) {
	if evm.vmConfig.NoRecursion && evm.depth > 0 {
		return nil, gas, nil
	}
	// Fail if we're trying to execute above the call depth limit
	if evm.depth > int(params.CallCreateDepth) {
		return nil, gas, ErrDepth
	}

	var (
		to       = AccountRef(addr)
		snapshot = evm.StateDB.Snapshot()
	)
	// Initialise a new contract and set the code that is to be used by the EVM.
	// The contract is a scoped environment for this execution context only.
	contract := NewContract(caller, to, new(big.Int), gas)
	contract.SetCallCode(&addr, evm.StateDB.GetCodeHash(addr), evm.StateDB.GetCode(addr))

	// We do an AddBalance of zero here, just in order to trigger a touch.
	// This doesn't matter on Mainnet, where all empties are gone at the time of Byzantium,
	// but is the correct thing to do and matters on other networks, in tests, and potential
	// future scenarios
	evm.StateDB.AddBalance(addr, bigZero)

	// When an error was returned by the EVM or when setting the creation code
	// above we revert to the snapshot and consume any gas remaining. Additionally
	// when we're in Homestead this also counts for code storage gas errors.
	ret, err = run(evm, contract, input, true)
	if err != nil {
		evm.StateDB.RevertToSnapshot(snapshot)
		if err != errExecutionReverted {
			contract.UseGas(contract.Gas)
		}
	}
	return ret, contract.Gas, err
}

type codeAndHash struct {
	code []byte
	hash common.Hash
}

func (c *codeAndHash) Hash() common.Hash {
	if c.hash == (common.Hash{}) {
		c.hash = crypto.Keccak256Hash(c.code)
	}
	return c.hash
}

// create creates a new contract using code as deployment code.
func (evm *EVM) create(caller ContractRef, codeAndHash *codeAndHash, gas uint64, value *big.Int, address common.Address) ([]byte, common.Address, uint64, error) {
	// Depth check execution. Fail if we're trying to execute above the
	// limit.
	if evm.depth > int(params.CallCreateDepth) {
		return nil, common.Address{}, gas, ErrDepth
	}
	if !evm.CanTransfer(evm.StateDB, caller.Address(), value) {
		return nil, common.Address{}, gas, ErrInsufficientBalance
	}
	if rcfg.UsingOVM {
		// Make sure the creator address should be able to deploy.
		if !evm.AddressWhitelisted(caller.Address()) {
			// Try to encode this error as a Solidity error message so it's more clear to end-users
			// what's going on when a contract creation fails.
			solerr := fmt.Errorf("deployer address not whitelisted: %s", caller.Address().Hex())
			ret, err := util.EncodeSolidityError(solerr)
			if err != nil {
				// If we're unable to properly encode the error then just return the original message.
				return nil, common.Address{}, gas, solerr
			}
			return ret, common.Address{}, gas, errExecutionReverted
		}
	}
	nonce := evm.StateDB.GetNonce(caller.Address())
	evm.StateDB.SetNonce(caller.Address(), nonce+1)

	// Ensure there's no existing contract already at the designated address
	contractHash := evm.StateDB.GetCodeHash(address)
	if evm.StateDB.GetNonce(address) != 0 || (contractHash != (common.Hash{}) && contractHash != emptyCodeHash) {
		return nil, common.Address{}, 0, ErrContractAddressCollision
	}
	// Create a new account on the state
	snapshot := evm.StateDB.Snapshot()
	evm.StateDB.CreateAccount(address)
	if evm.chainRules.IsEIP158 {
		evm.StateDB.SetNonce(address, 1)
	}
	evm.Transfer(evm.StateDB, caller.Address(), address, value)

	// Initialise a new contract and set the code that is to be used by the EVM.
	// The contract is a scoped environment for this execution context only.
	contract := NewContract(caller, AccountRef(address), value, gas)
	contract.SetCodeOptionalHash(&address, codeAndHash)

	if evm.vmConfig.NoRecursion && evm.depth > 0 {
		return nil, address, gas, nil
	}

	if evm.vmConfig.Debug && evm.depth == 0 {
		evm.vmConfig.Tracer.CaptureStart(caller.Address(), address, true, codeAndHash.code, gas, value)
	}
	start := time.Now()

	ret, err := run(evm, contract, nil, false)

	// check whether the max code size has been exceeded
	maxCodeSizeExceeded := evm.chainRules.IsEIP158 && len(ret) > params.MaxCodeSize
	// if the contract creation ran successfully and no errors were returned
	// calculate the gas required to store the code. If the code could not
	// be stored due to not enough gas set an error and let it be handled
	// by the error checking condition below.
	if err == nil && !maxCodeSizeExceeded {
		createDataGas := uint64(len(ret)) * params.CreateDataGas
		if contract.UseGas(createDataGas) {
			evm.StateDB.SetCode(address, ret)
		} else {
			err = ErrCodeStoreOutOfGas
		}
	}

	// When an error was returned by the EVM or when setting the creation code
	// above we revert to the snapshot and consume any gas remaining. Additionally
	// when we're in homestead this also counts for code storage gas errors.
	if maxCodeSizeExceeded || (err != nil && (evm.chainRules.IsHomestead || err != ErrCodeStoreOutOfGas)) {
		evm.StateDB.RevertToSnapshot(snapshot)
		if err != errExecutionReverted {
			contract.UseGas(contract.Gas)
		}
	}
	// Assign err if contract code size exceeds the max while the err is still empty.
	if maxCodeSizeExceeded && err == nil {
		err = errMaxCodeSizeExceeded
	}
	if evm.vmConfig.Debug && evm.depth == 0 {
		evm.vmConfig.Tracer.CaptureEnd(ret, gas-contract.Gas, time.Since(start), err)
	}
	return ret, address, contract.Gas, err

}

// Create creates a new contract using code as deployment code.
func (evm *EVM) Create(caller ContractRef, code []byte, gas uint64, value *big.Int) (ret []byte, contractAddr common.Address, leftOverGas uint64, err error) {
	contractAddr = crypto.CreateAddress(caller.Address(), evm.StateDB.GetNonce(caller.Address()))
	return evm.create(caller, &codeAndHash{code: code}, gas, value, contractAddr)
}

// Create2 creates a new contract using code as deployment code.
//
// The different between Create2 with Create is Create2 uses sha3(0xff ++ msg.sender ++ salt ++ sha3(init_code))[12:]
// instead of the usual sender-and-nonce-hash as the address where the contract is initialized at.
func (evm *EVM) Create2(caller ContractRef, code []byte, gas uint64, endowment *big.Int, salt *big.Int) (ret []byte, contractAddr common.Address, leftOverGas uint64, err error) {
	codeAndHash := &codeAndHash{code: code}
	contractAddr = crypto.CreateAddress2(caller.Address(), common.BigToHash(salt), codeAndHash.Hash().Bytes())
	return evm.create(caller, codeAndHash, gas, endowment, contractAddr)
}

// ChainConfig returns the environment's chain configuration
func (evm *EVM) ChainConfig() *params.ChainConfig { return evm.chainConfig }

func (evm *EVM) AddressWhitelisted(addr common.Address) bool {
	// First check if the owner is address(0), which implicitly disables the whitelist.
	ownerKey := common.Hash{}
	owner := evm.StateDB.GetState(dump.OvmWhitelistAddress, ownerKey)
	if (owner == common.Hash{}) {
		return true
	}

	// Next check if the user is whitelisted by resolving the position where the
	// true/false value would be.
	position := common.Big1
	hasher := sha3.NewLegacyKeccak256()
	hasher.Write(common.LeftPadBytes(addr.Bytes(), 32))
	hasher.Write(common.LeftPadBytes(position.Bytes(), 32))
	digest := hasher.Sum(nil)
	key := common.BytesToHash(digest)
	isWhitelisted := evm.StateDB.GetState(dump.OvmWhitelistAddress, key)
	return isWhitelisted != common.Hash{}
}
