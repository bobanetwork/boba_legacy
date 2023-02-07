package boba

import (
	"errors"
	"math/big"
	"testing"

	"github.com/ethereum-optimism/optimism/l2geth/common"
	"github.com/ethereum-optimism/optimism/l2geth/common/hexutil"
	"github.com/ethereum-optimism/optimism/l2geth/core"
	"github.com/ethereum-optimism/optimism/l2geth/core/rawdb"
	"github.com/ethereum-optimism/optimism/l2geth/core/state"
	"github.com/ethereum-optimism/optimism/l2geth/core/vm"
	"github.com/ethereum-optimism/optimism/l2geth/crypto"
	"github.com/ethereum-optimism/optimism/l2geth/params"
	"github.com/ethereum-optimism/optimism/l2geth/tests"
)

var (
	ErrTuringInputTooShort = errors.New("turing input too short")
	ErrTuringEmpty         = errors.New("turing replay data not found")
	contractAddr           = common.HexToAddress("0x00000000000000000000000000000000deadbeef")
	EOAAddr                = common.HexToAddress("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")
)

type ContractRef struct{}

func (ContractRef) Address() common.Address { return contractAddr }

func vmTestBlockHash(n uint64) common.Hash {
	return common.BytesToHash(crypto.Keccak256([]byte(big.NewInt(int64(n)).String())))
}

func newEVM(statedb *state.StateDB, vmconfig vm.Config) *vm.EVM {
	initialCall := true
	canTransfer := func(db vm.StateDB, address common.Address, amount *big.Int) bool {
		if initialCall {
			initialCall = false
			return true
		}
		return core.CanTransfer(db, address, amount)
	}
	transfer := func(db vm.StateDB, sender, recipient common.Address, amount *big.Int) {}
	context := vm.Context{
		CanTransfer: canTransfer,
		Transfer:    transfer,
		GetHash:     vmTestBlockHash,
		Origin:      EOAAddr,
		Coinbase:    EOAAddr,
		BlockNumber: new(big.Int).SetUint64(0),
		Time:        new(big.Int).SetUint64(0),
		GasLimit:    0,
		Difficulty:  common.Big1,
		GasPrice:    common.Big1,
	}
	vmconfig.NoRecursion = true
	return vm.NewEVM(context, statedb, params.MainnetChainConfig, vmconfig)
}

func createStateDB() *state.StateDB {
	alloc := core.GenesisAlloc{}
	alloc[contractAddr] = core.GenesisAccount{
		Nonce:   1,
		Code:    hexutil.MustDecode("0x63deadbeef60005263cafebabe6004601c6000F560005260206000F3"),
		Balance: big.NewInt(1),
	}
	statedb := tests.MakePreState(rawdb.NewMemoryDatabase(), alloc)
	return statedb
}

func TestHybridComputeShortInput(t *testing.T) {
	errTuringInput := []byte{125, 147, 97, 108}
	TuringInput := append(errTuringInput[:], make([]byte, 32)...)
	statedb := createStateDB()
	evm := newEVM(statedb, vm.Config{})
	if _, _, err := evm.Call(ContractRef{}, EOAAddr, errTuringInput, 0, common.Big0); err == ErrTuringInputTooShort {
		t.Fatalf("should return 'turing input too short', but got err %v", err)
	}
	if _, _, err := evm.Call(ContractRef{}, EOAAddr, TuringInput, 0, common.Big0); err == ErrTuringEmpty {
		t.Fatalf("should return 'turing replay data not found', but got err %v", err)
	}
}

func TestHybridComputeGetRandomShortInput(t *testing.T) {
	errGetRandInput := []byte{73, 61, 87, 214}
	getRandInputInput := append(errGetRandInput[:], make([]byte, 32)...)
	statedb := createStateDB()
	evm := newEVM(statedb, vm.Config{})
	if _, _, err := evm.Call(ContractRef{}, EOAAddr, errGetRandInput, 0, common.Big0); err == ErrTuringInputTooShort {
		t.Fatalf("should return 'turing input too short', but got err %v", err)
	}
	if _, _, err := evm.Call(ContractRef{}, EOAAddr, getRandInputInput, 0, common.Big0); err == ErrTuringEmpty {
		t.Fatalf("should return 'turing replay data not found', but got err %v", err)
	}
}

func TestShortInput(t *testing.T) {
	standardInput := []byte{0, 0, 0, 0}
	statedb := createStateDB()
	evm := newEVM(statedb, vm.Config{})
	if _, _, err := evm.Call(ContractRef{}, EOAAddr, standardInput, 0, common.Big0); err != nil {
		t.Fatalf("should return nil, but got err %v", err)
	}
}
