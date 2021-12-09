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
	"fmt"
	"math/big"
	"sync/atomic"
	"time"
	"sync"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/params"
	"github.com/ethereum/go-ethereum/rollup/dump"
	"github.com/ethereum/go-ethereum/rollup/rcfg"
	"github.com/ethereum/go-ethereum/rollup/util"
	"golang.org/x/crypto/sha3"

	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/log"

	"github.com/ethereum/go-ethereum/rlp"
	"github.com/ethereum/go-ethereum/rpc"
)

// emptyCodeHash is used by create to ensure deployment is disallowed to already
// deployed contract addresses (relevant after the account abstraction).
var emptyCodeHash = crypto.Keccak256Hash(nil)
//test purposes
var deadPrefix = hexutil.MustDecode("0xdeaddeaddeaddeaddeaddeaddeaddeaddead")

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
			if !bytes.HasPrefix((contract.Address()).Bytes(), deadPrefix) {
				//plot everything except for things with the deadPrefix
				log.Debug("TURING processing contract", "Address", contract.Address().Hex())
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
}

// FIXME - should move this somewhere else.
// For now, only caches the most recent result. Can be extended with a map of
// multiple requests, but that needs some logic to expire/purge old entries.
// "key" for now is simply the request URL. May need tighter scope in the future,
// e.g. per contract. That would also allow different expiration thresholds for
// different users.
//
// Another future enhancement could be to allow an external program to pre-load
// results into the cache on a periodic basis (e.g. updating the latest market
// prices for various tokens). Contracts would then be able to access this data
// without the latency of making an off-chain JSON-RPC call. This is similar to
// some of the earlier concepts for a "Turing" mechanism.

var turingCache struct {
	lock		sync.RWMutex
	expires		time.Time
	key			string
	value		[]byte
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
// rewrite the parameters so that the contract can be called a second time.
// FIXME - needs error handling. For now, bails out and lets the contract
// be called a second time with the original parameters. 2nd failure is not intercepted.

func bobaTuringCall(reqString []byte, oldValue hexutil.Bytes) hexutil.Bytes {

    //reqString []byte -> everything after the _OMGXTURING_ - this is the RLP encoded data from the revert string
    //oldvalue -> the original input to the call
    //new_in := bobaTuringCall(rest, input)
	
	var responseStringEnc string
	var responseString []byte
	var reqFields [4]string

    //Step  1 - let's decode the RLP - the 'rest' we generated earlier
	if err := rlp.Decode(bytes.NewReader(reqString), &reqFields); err != nil {
		log.Warn("TURING-0 bobaTuringCall:RLP decoding failed", "err", err)
		//return bad
	} else {
		log.Debug("TURING-0 bobaTuringCall:RLP decoded OK", "reqFields", reqFields)
	}

    reqVer := reqFields[0]

	if reqVer != "\x01" {
		log.Warn("TURING-1 bobaTuringCall:Unexpected request version", "ver", hexutil.Bytes(reqVer))
		//return bad
	}
	reqUrl := reqFields[1]
	reqMethod := reqFields[2]
	reqValue := reqFields[3]
	
	//at this point we have all the info we need to call off-chain
	log.Debug ("TURING bobaTuringCall information", 
		"version", hexutil.Bytes(reqVer),
		"url", reqUrl, 
		"method", reqMethod, 
		"value", reqValue,
		"reqString", reqString)

	prefix := make([]byte, 4)
	copy(prefix,oldValue[0:4]) //we preserve the 4 byte methodSelector = calldata[0:4]

	// If decoding fails, we'll return a "0" parameter which should fail a
	// "require" in the contract without generating another TURING marker.
	// FIXME - would be cleaner to return nil here and put better error handling
	// into l2geth to avoid that second call into the contract.

    //oldValue aka input
    //first 4 bytes = prefix
    //next 32 bytes = method_idx
    //next 32 bytes = 1 for Request, 2 for Response

	// Some other consistency checks. Probably OK to remove these at some point.
	rest := oldValue[4:]	
	rlen := len(rest)
	method_idx := rest[0:32] // This value is preserved and passed back on the 2nd call
	rtypeRaw := rest[32:64]  // can be 0, 1, or 2 - but seems to get garbled a lot
	
    log.Debug ("TURING bobaTuringCall prep", 
		"prefix", prefix, 
		"rest", rest,
		"oldvalue", oldValue,
		"rlen", rlen,
	    "method_idx", method_idx,
	    "rtypeRaw", rtypeRaw)

/*
retRaw="
[
8 195 121 160
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 32 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 145 
95 79 77 71 88 84 85 82 73 78 71 95 //ASCII for _OMGXTURING_
248 //ASCII for ø
131 1 153 104 116 116 112 58 47 47 49 57 50 46 49 54 56 46 49 46 50 52 54 58 49 50 51 52 133 104 101 108 108 111 184 96 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 5 69 78 95 85 83 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]" 
ret=
0x08c379a
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 02
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 091
5f4f4d4758545552494e475f //HEX for ASCI for _OMGXTURING_
f8 //ø
830199687474703a2f2f3139322e3136382e312e3234363a3132333485 // http://192.168.1.246:1234
68656c6c6f // hello -> the method
b86
0000000000000000000000000000000000000000000000000000000000000002
00000000000000000000000000000000000000000000000000000000000000005
454e5f5553 //EN_US - the message
000000000000000000000000000000000000000000000000000000000000000000000000000000000000 

input=
0x530f8fcf
000000000000000000000000000000000000000000000000000000000000002
00000000000000000000000000000000000000000000000000000000000000005
454e5f5553
000000000000000000000000000000000000000000000000000000

ret=0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000091
5f4f4d4758545552494e475ff8830199687474703a2f2f3139322e3136382e312e3234363a313233348568656c6c6fb86000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000005454e5f5553000000000000000000000000000000000000000000000000000000000000000000000000000000000000


0x08c379a
0000000000000000000000000000000000000000000000000000000000000002
0000000000000000000000000000000000000000000000000000000000000009
1
5f4f4d4758545552494e475f
f8
830199 //RLP header
687474703a2f2f3139322e3136382e312e3234363a31323334 //http
85 //RLP header 
6a616e3132 //jan12
b86000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000005454e5f5553000000000000000000000000000000000000000000000000000000000000000000000000000000000000


0xcdcd77c0
0000000000000000000000000000000000000000000000000000000000000045
0000000000000000000000000000000000000000000000000000000000000001

*/

	bad := append(prefix, method_idx...)
	bad = append(bad, hexutil.MustDecode(fmt.Sprintf("0x%064x", 0))...) //0 denotes failure

	log.Debug ("TURING-1 bobaTuringCall:Decode oldValue", 
		"prefix", prefix, 
		"rest", rest, 
		"rlen", rlen,
		"bad", bad,
		"mustdecode", fmt.Sprintf("0x%064x", 0),
		"hu", hexutil.MustDecode(fmt.Sprintf("0x%064x", 0))) //[0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0] //32 bytes

	if (rlen < 128) {
		log.Warn("TURING-2 bobaTuringCall:Unexpected oldValue in bobaTuringCall", "len < 128", rlen)
		//return bad
	}

	rType_big := new(big.Int).SetBytes(rest[32:64]) // 1 for Request, 2 for Response
	rType := int(rType_big.Uint64())
	if (rType != 1) {
		log.Warn("TURING-3 bobaTuringCall:Wrong state (rType != 1)", "rType", rType)
		return bad
	}

	var ret hexutil.Bytes

    //the really important part - if we have data, and if the time is right,
    //replace the calldata   
	// turingCache.lock.Lock()
	// if reqValue == turingCache.key && time.Now().Before(turingCache.expires) {
	// 	ret = turingCache.value
	// }
	// turingCache.lock.Unlock()

	if ret != nil {
		log.Debug("TURING-7 bobaTuringCall:TuringCache hit for", "key", reqValue)
		return ret
	}

    //if we have not yet returned by now, we (1) have a Turing compute request, and
    //(2) we DO NOT have a valid response from off-chain, so let's get one now and 
    //save it for later 

	client,err := rpc.Dial(reqUrl)

	if client != nil {
		log.Debug("TURING-8 bobaTuringCall:Calling off-chain client at", "url", reqFields[1])
		if err := client.Call(&responseStringEnc, reqMethod, hexutil.Bytes(reqValue)); err != nil {
			log.Warn("TURING-9 bobaTuringCall:Client error", "err", err)
			return bad
		}
		responseString, err = hexutil.Decode(responseStringEnc)
		if err != nil {
			log.Warn("TURING-10 bobaTuringCall:Error decoding responseString", "err", err)
			return bad
		}
	} else {
		log.Warn("TURING-11 bobaTuringCall:Failed to create client for off-chain request", "err", err)
		return bad
	}

	log.Debug("TURING-12 bobaTuringCall:Have valid response from offchain API", 
		"Request", reqValue, 
		"Response", responseString)

	rsLen := len(responseString)
	new_val := hexutil.MustDecode(fmt.Sprintf("0x%064x", rsLen)) //length of the response 
	rsBytes := []byte(responseString)                            //the response itself
	new_val = append(new_val, rsBytes...) 

    //pad the response if needed
	tmpLen := len(new_val) % 32
	if tmpLen > 0 {
		pad := bytes.Repeat([]byte{0}, 32 - tmpLen)
		new_val = append(new_val, pad...)
	}
    
    //build the calldata: 
    //	MethodID,
	//  methodIndex,
	//  rType = 2,
	//  96 = 3*32
	//  and the new value preceeded by its length
	ret = append(prefix, method_idx...)                                  //the usual prefix and the method_idx, unchanged
	ret = append(ret, hexutil.MustDecode(fmt.Sprintf("0x%064x", 2))...)  //this is a response, hence change 1 -> 2
	ret = append(ret, hexutil.MustDecode(fmt.Sprintf("0x%064x", 96))...) //length of response slots? - this number might change in some cases
	ret = append(ret, new_val...)                                        //and the data themselves                

/*
desired:
0x
4f9d6d19
0000000000000000000000000000000000000000000000000000000000000060 //96 - length of inputs
000000000000000000000000000000000000000000000000000000000000002a //value 1 = 42
00000000000000000000000000000000000000000000000000000000000004d2 //value 2 = 1234
0000000000000000000000000000000000000000000000000000000000000003 //3 = string length
454e5f0000000000000000000000000000000000000000000000000000000000 //the string

0x
530f8fcf
0000000000000000000000000000000000000000000000000000000000000020 //32
0000000000000000000000000000000000000000000000000000000000000002 //2 should be the methodID but that's wrong 
0000000000000000000000000000000000000000000000000000000000000060 //96
0000000000000000000000000000000000000000000000000000000000000060 //96
0000000000000000000000000000000000000000000000000000000000000020 //32
000000000000000000000000000000000000000000000000000000000000000b //11 = length of hello world 
48656c6c6f20576f726c64000000000000000000000000000000000000000000 //hello world
*/

	log.Debug("TURING-13 bobaTuringCall:Modified parameters", "newValue", ret)

    //saving the "updated" calldata in the cache
	turingCache.lock.Lock()
	turingCache.key = reqValue
	turingCache.expires = time.Now().Add(2*time.Second)
	turingCache.value = ret
	turingCache.lock.Unlock()

	log.Debug("TURING-14 bobaTuringCall:TuringCache entry stored for", "key", reqValue)

	return ret
}

// Call executes the contract associated with the addr with the given input as
// parameters. It also handles any necessary value transfer required and takes
// the necessary steps to create accounts and reverses the state in case of an
// execution error or failed value transfer.
func (evm *EVM) Call(caller ContractRef, addr common.Address, input []byte, gas uint64, value *big.Int) (ret []byte, leftOverGas uint64, err error) {
	
	if !bytes.HasPrefix(addr.Bytes(), deadPrefix) {
		log.Debug("TURING entering Call", 
			"depth", evm.depth, 
			"addr", addr, 
			"input", hexutil.Bytes(input), 
			"gas", gas)
	}

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
	ret, err = run(evm, contract, input, false)

	if ! bytes.HasPrefix(contract.CodeAddr.Bytes(), deadPrefix) {
		log.Debug("TURING evm.go run", 
			"contract", contract.CodeAddr, 
			"ret", hexutil.Bytes(ret), 
			"err", err)
	}

	if err != nil {
		if ! bytes.HasPrefix(contract.CodeAddr.Bytes(), deadPrefix) {

			isTuring := bytes.Contains(ret, []byte("_OMGXTURING_"))
			
			if isTuring {
				log.Debug("YES TURING", 
				"err", err, 
				"retRaw", ret, 
				"ret", hexutil.Bytes(ret), 
				"input", hexutil.Bytes(input), 
				"contract", contract.CodeAddr, 
				"turing", isTuring)
			}

			log.Debug("TURING evm.go run result", 
				"err", err, 
				"ret", hexutil.Bytes(ret), 
				"input", hexutil.Bytes(input), 
				"contract", contract.CodeAddr, 
				"turing", isTuring)

			if isTuring /*&& rcfg.UsingOVM*/ {

                //at this point we have a call that has reverted AND the ret includes _OMGXTURING_ somewhere in it
                //let's chop off _OMGXTURING_ and then focus on the remainder with the parameters, the URL, etc.

/*
retRaw="
[
8 195 121 160
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 32 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 145 
95 79 77 71 88 84 85 82 73 78 71 95 //ASCII for _OMGXTURING_
248 //ASCII for ø
131 1 153 104 116 116 112 58 47 47 49 57 50 46 49 54 56 46 49 46 50 52 54 58 49 50 51 52 133 104 101 108 108 111 184 96 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 32 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 5 69 78 95 85 83 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]" 
ret=
0x08c379a
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 02
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 091
5f4f4d4758545552494e475f //HEX for ASCI for _OMGXTURING_
f8 //ø
830199687474703a2f2f3139322e3136382e312e3234363a3132333485 // http://192.168.1.246:1234
68656c6c6f // hello -> the method
b86
0000000000000000000000000000000000000000000000000000000000000002
00000000000000000000000000000000000000000000000000000000000000005
454e5f5553 //EN_US - the message
000000000000000000000000000000000000000000000000000000000000000000000000000000000000 

input=
0x530f8fcf
000000000000000000000000000000000000000000000000000000000000002
00000000000000000000000000000000000000000000000000000000000000005
454e5f5553
000000000000000000000000000000000000000000000000000000

(uint32 method_idx, uint32 rType, bytes memory _slot)

0x
530f8fcf
0000000000000000000000000000000000000000000000000000000000000020
0000000000000000000000000000000000000000000000000000000000000005
454e5f5553000000000000000000000000000000000000000000000000000000


0x
530f8fcf
0000000000000000000000000000000000000000000000000000000000000020
0000000000000000000000000000000000000000000000000000000000000000

input=
0x
530f8fcf
0000000000000000000000000000000000000000000000000000000000000020
0000000000000000000000000000000000000000000000000000000000000005
454e5f5553000000000000000000000000000000000000000000000000000000

ret=0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000091
5f4f4d4758545552494e475ff8830199687474703a2f2f3139322e3136382e312e3234363a313233348568656c6c6fb86000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000005454e5f5553000000000000000000000000000000000000000000000000000000000000000000000000000000000000

input=
0x
e611968a
0000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000040
0000000000000000000000000000000000000000000000000000000000000060
0000000000000000000000000000000000000000000000000000000000000020
0000000000000000000000000000000000000000000000000000000000000002
4652000000000000000000000000000000000000000000000000000000000000
*/

				//find the "_OMGXTURING_" string - everything after that is the 
				//RLP encoded instructions
				header := "_OMGXTURING_";
				ii := bytes.Index(ret, []byte(header))

				headerLen := len(header)
			    rest := ret[ii+headerLen/*12*/ /*==the length of _OMGXTURING_*/:]
				
				//Now the 'rest' contains the important stuff, namely: 
				//the version number, the function name, the URL, and input(s)
				//to the compute endpoint 
				log.Debug("TURING-M1 calling bobaTuringCall(rest, input)", 
					"rest", rest,
					"input", input)

                //bobaTuringCall takes the original 'input' (aka calldata), figures out what needs 
                //to be done (via inspection of the instuctions in 'rest'), and then synthesizes a 
                //'new_in' calldata that does not lead to the revert (by changing rType from 1 to 2)
				new_in := bobaTuringCall(rest, input)

				//evm.StateDB.RevertToSnapshot(snapshot) // thoughts?
                
                log.Debug("TURING-M2 replay with modified calldata", 
					"modifiedCalldata", hexutil.Bytes(new_in))

                //and then rerun the call with the modified calldata
				ret, err = run(evm, contract, new_in, false)
				//the only point of the function is now to return the modified calldata
				//as the response to the caller

				log.Debug("TURING-M3 received replay response", 
					"err", err, 
					"ret", hexutil.Bytes(ret))
			}
		}
	}

	// When an error was returned by the EVM or when setting the creation code
	// above we revert to the snapshot and consume any gas remaining. Additionally
	// when we're in homestead this also counts for code storage gas errors.
	if err != nil {
		evm.StateDB.RevertToSnapshot(snapshot)
		log.Debug("TURING evm.go errExecutionReverted")
		if err != errExecutionReverted {
			contract.UseGas(contract.Gas)
		}
	}

	if !bytes.HasPrefix(addr.Bytes(), deadPrefix) {
		log.Debug("TURING exiting Call", 
			"depth", evm.depth, 
			"addr", addr, 
			"ret", hexutil.Bytes(ret), 
			"err", err);
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
