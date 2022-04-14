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

package core

import (
	"errors"
	"math"
	"math/big"

	"github.com/ethereum-optimism/optimism/l2geth/common"
	"github.com/ethereum-optimism/optimism/l2geth/common/hexutil"
	"github.com/ethereum-optimism/optimism/l2geth/core/types"
	"github.com/ethereum-optimism/optimism/l2geth/core/vm"
	"github.com/ethereum-optimism/optimism/l2geth/log"
	"github.com/ethereum-optimism/optimism/l2geth/params"
	"github.com/ethereum-optimism/optimism/l2geth/rollup/fees"
	"github.com/ethereum-optimism/optimism/l2geth/rollup/rcfg"
)

var (
	errInsufficientBalanceForGas = errors.New("insufficient balance to pay for gas")
)

/*
The State Transitioning Model

A state transition is a change made when a transaction is applied to the current world state
The state transitioning model does all the necessary work to work out a valid new state root.

1) Nonce handling
2) Pre pay gas
3) Create a new state object if the recipient is \0*32
4) Value transfer
== If contract creation ==
  4a) Attempt to run transaction data
  4b) If valid, use result as code for the new state object
== end ==
5) Run Script section
6) Derive new state root
*/
type StateTransition struct {
	gp         *GasPool
	msg        Message
	gas        uint64
	gasPrice   *big.Int
	initialGas uint64
	value      *big.Int
	data       []byte
	state      vm.StateDB
	evm        *vm.EVM
	// UsingOVM
	l1Fee       *big.Int
	l2ExtraGas  *big.Int
	isGasUpdate bool
}

// Message represents a message sent to a contract.
type Message interface {
	From() common.Address
	//FromFrontier() (common.Address, error)
	To() *common.Address

	GasPrice() *big.Int
	Gas() uint64
	Value() *big.Int

	Nonce() uint64
	CheckNonce() bool
	Data() []byte
	AccessList() types.AccessList

	L1Timestamp() uint64
	L1BlockNumber() *big.Int
	QueueOrigin() types.QueueOrigin
	L1Turing() []byte // Interface to func (m Message) L1Turing() []byte { return m.l1Turing } in transaction.go
}

// IntrinsicGas computes the 'intrinsic gas' for a message with the given data.
func IntrinsicGas(data []byte, contractCreation, isHomestead bool, isEIP2028 bool) (uint64, error) {
	// Set the starting gas for the raw transaction
	var gas uint64
	if contractCreation && isHomestead {
		gas = params.TxGasContractCreation
	} else {
		gas = params.TxGas
	}
	// Bump the required gas by the amount of transactional data
	if len(data) > 0 {
		// Zero and non-zero bytes are priced differently
		var nz uint64
		for _, byt := range data {
			if byt != 0 {
				nz++
			}
		}
		// Make sure we don't exceed uint64 for all data combinations
		nonZeroGas := params.TxDataNonZeroGasFrontier
		if isEIP2028 {
			nonZeroGas = params.TxDataNonZeroGasEIP2028
		}
		if (math.MaxUint64-gas)/nonZeroGas < nz {
			return 0, vm.ErrOutOfGas
		}
		gas += nz * nonZeroGas

		z := uint64(len(data)) - nz
		if (math.MaxUint64-gas)/params.TxDataZeroGas < z {
			return 0, vm.ErrOutOfGas
		}
		gas += z * params.TxDataZeroGas
	}
	return gas, nil
}

// NewStateTransition initialises and returns a new state transition object.
func NewStateTransition(evm *vm.EVM, msg Message, gp *GasPool) *StateTransition {
	l1Fee := new(big.Int)
	l2ExtraGas := new(big.Int)
	var isGasUpdate = true
	if rcfg.UsingOVM {
		if msg.GasPrice().Cmp(common.Big0) != 0 {
			// Compute the L1 fee before the state transition
			// so it only has to be read from state one time.
			l1Fee, _ = fees.CalculateL1MsgFee(msg, evm.StateDB, nil)
			l2ExtraGas, _ = fees.CalculateL2GasForL1Msg(msg, evm.StateDB, nil)
		}

		isGasUpdate = evm.ChainConfig().IsGasUpdate(evm.BlockNumber)
	}

	return &StateTransition{
		gp:          gp,
		evm:         evm,
		msg:         msg,
		gasPrice:    msg.GasPrice(),
		value:       msg.Value(),
		data:        msg.Data(),
		state:       evm.StateDB,
		l1Fee:       l1Fee,
		l2ExtraGas:  l2ExtraGas,
		isGasUpdate: isGasUpdate,
	}
}

// ApplyMessage computes the new state by applying the given message
// against the old state within the environment.
//
// ApplyMessage returns the bytes returned by any EVM execution (if it took place),
// the gas used (which includes gas refunds) and an error if it failed. An error always
// indicates a core error meaning that the message would always fail for that particular
// state and would never be accepted within a block.
func ApplyMessage(evm *vm.EVM, msg Message, gp *GasPool) ([]byte, uint64, bool, error) {
	return NewStateTransition(evm, msg, gp).TransitionDb()
}

// to returns the recipient of the message.
func (st *StateTransition) to() common.Address {
	if st.msg == nil || st.msg.To() == nil /* contract creation */ {
		return common.Address{}
	}
	return *st.msg.To()
}

func (st *StateTransition) useGas(amount uint64) error {
	if st.gas < amount {
		return vm.ErrOutOfGas
	}
	st.gas -= amount

	return nil
}

func (st *StateTransition) buyGas() error {
	mgval := new(big.Int).Mul(new(big.Int).SetUint64(st.msg.Gas()), st.gasPrice)
	if rcfg.UsingOVM {
		// Only charge the L1 fee for QueueOrigin sequencer transactions
		if st.msg.QueueOrigin() == types.QueueOriginSequencer {
			if st.isGasUpdate {
				extraL2Fee := new(big.Int).Mul(st.l2ExtraGas, st.gasPrice)
				log.Debug("Adding extra L2 fee", "extra-l2-fee", extraL2Fee)
				mgval = mgval.Add(mgval, extraL2Fee)
			} else {
				mgval = mgval.Add(mgval, st.l1Fee)
			}
			if st.msg.CheckNonce() {
				log.Debug("Total fee", "total-fee", mgval)
			}
		}
	}
	if st.state.GetBalance(st.msg.From()).Cmp(mgval) < 0 {
		if rcfg.UsingOVM {
			// Hack to prevent race conditions with the `gas-oracle`
			// where policy level balance checks pass and then fail
			// during consensus. The user gets some free gas
			// in this case.
			mgval = st.state.GetBalance(st.msg.From())
		} else {
			return errInsufficientBalanceForGas
		}
	}
	if err := st.gp.SubGas(st.msg.Gas()); err != nil {
		return err
	}
	st.gas += st.msg.Gas()

	st.initialGas = st.msg.Gas()
	st.state.SubBalance(st.msg.From(), mgval)
	return nil
}

func (st *StateTransition) preCheck() error {
	// Make sure this transaction's nonce is correct.
	if st.msg.CheckNonce() {
		if rcfg.UsingOVM {
			if st.msg.QueueOrigin() == types.QueueOriginL1ToL2 {
				return st.buyGas()
			}
		}
		nonce := st.state.GetNonce(st.msg.From())
		if nonce < st.msg.Nonce() {
			return ErrNonceTooHigh
		} else if nonce > st.msg.Nonce() {
			return ErrNonceTooLow
		}
	}
	return st.buyGas()
}

// TransitionDb will transition the state by applying the current message and
// returning the result including the used gas. It returns an error if failed.
// An error indicates a consensus issue.
func (st *StateTransition) TransitionDb() (ret []byte, usedGas uint64, failed bool, err error) {
	if err = st.preCheck(); err != nil {
		return
	}
	msg := st.msg
	sender := vm.AccountRef(msg.From())
	homestead := st.evm.ChainConfig().IsHomestead(st.evm.BlockNumber)
	istanbul := st.evm.ChainConfig().IsIstanbul(st.evm.BlockNumber)
	contractCreation := msg.To() == nil

	// Pay intrinsic gas
	gas, err := IntrinsicGas(st.data, contractCreation, homestead, istanbul)
	if err != nil {
		return nil, 0, false, err
	}
	if err = st.useGas(gas); err != nil {
		return nil, 0, false, err
	}

	var (
		evm = st.evm
		// vm errors do not effect consensus and are therefore
		// not assigned to err, except for insufficient balance
		// error.
		vmerr error
	)

	// The access list gets created here
	if rules := st.evm.ChainConfig().Rules(st.evm.Context.BlockNumber); rules.IsBerlin {
		st.state.PrepareAccessList(msg.From(), msg.To(), vm.ActivePrecompiles(rules), msg.AccessList())
	}

	if contractCreation {
		ret, _, st.gas, vmerr = evm.Create(sender, st.data, st.gas, st.value)
	} else {
		// Increment the nonce for the next transaction
		st.state.SetNonce(msg.From(), st.state.GetNonce(msg.From())+1)
		ret, st.gas, vmerr = evm.Call(sender, st.to(), st.data, st.gas, st.value)
	}

	if vmerr != nil {
		log.Debug("VM returned with error", "err", vmerr, "ret", hexutil.Encode(ret))
		// The only possible consensus-error would be if there wasn't
		// sufficient balance to make the transfer happen. The first
		// balance transfer may never fail.
		if vmerr == vm.ErrInsufficientBalance {
			return nil, 0, false, vmerr
		}
	}
	st.refundGas()

	if st.isGasUpdate {
		st.state.AddBalance(evm.Coinbase, new(big.Int).Mul(new(big.Int).SetUint64(st.gasUsed()), st.gasPrice))
	} else {
		// The L2 Fee is the same as the fee that is charged in the normal geth
		// codepath. Add the L1 fee to the L2 fee for the total fee that is sent
		// to the sequencer.
		l2Fee := new(big.Int).Mul(new(big.Int).SetUint64(st.gasUsed()), st.gasPrice)
		fee := new(big.Int).Add(st.l1Fee, l2Fee)
		st.state.AddBalance(evm.Coinbase, fee)
	}

	return ret, st.gasUsed(), vmerr != nil, err
}

func (st *StateTransition) refundGas() {
	// Apply refund counter, capped to half of the used gas.
	// Only refund a partial gas
	var refund uint64
	if st.isGasUpdate {
		refund = (st.gasUsed() - st.l2ExtraGas.Uint64()) / 2
	} else {
		refund = st.gasUsed() / 2
	}
	if refund > st.state.GetRefund() {
		refund = st.state.GetRefund()
	}
	st.gas += refund

	// Return ETH for remaining gas, exchanged at the original rate.
	remaining := new(big.Int).Mul(new(big.Int).SetUint64(st.gas), st.gasPrice)
	st.state.AddBalance(st.msg.From(), remaining)

	// Also return remaining gas to the block gas counter so it is
	// available for the next transaction.
	st.gp.AddGas(st.gas)
}

// gasUsed returns the amount of gas used up by the state transition.
func (st *StateTransition) gasUsed() uint64 {
	if rcfg.UsingOVM {
		if st.isGasUpdate {
			return st.initialGas - st.gas + st.l2ExtraGas.Uint64()
		}
		return st.initialGas - st.gas
	} else {
		return st.initialGas - st.gas
	}
}
